from datetime import timedelta
from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Schedule, Vacation, INTERVALO_ENTRE_ATENDIMENTOS_MIN
from client.models import Client
from barber.models import Barber
from finance.models import Finances
from notifications.services import avisar_lista_de_espera, notify_barber, notify_client, remover_lembretes


class ScheduleSerializer(serializers.ModelSerializer):
    barber_name = serializers.CharField(source='barber.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    client_name_display = serializers.CharField(source='client_name.name', read_only=True)

    payment_method = serializers.ChoiceField(
        choices=Finances.PAYMENT_CHOICES,
        write_only=True,
        required=False
    )

    class Meta:
        model = Schedule
        fields = "__all__"
        read_only_fields = ['end_time']

    # mudanças de status aceitas; concluído, cancelado e bloqueado não mudam mais
    TRANSICOES = {
        "agendado": {"confirmado", "concluido", "cancelado"},
        "confirmado": {"agendado", "concluido", "cancelado"},
    }

    def _validar_status(self, data, instance):
        request = self.context.get("request")
        if instance is None:
            if not Barber.objects.filter(user=request.user).exists():
                data["status"] = "agendado"  # o cliente só cria agendamentos comuns
            elif data.get("status", "agendado") not in ("agendado", "confirmado", "bloqueado"):
                raise serializers.ValidationError({"status": "Um novo horário só pode ser agendado, confirmado ou bloqueado."})
            if data.get("status", "agendado") != "bloqueado" and not data.get("service"):
                raise serializers.ValidationError({"service": "Escolha um serviço."})
        elif "status" in data and data["status"] != instance.status:
            if data["status"] not in self.TRANSICOES.get(instance.status, set()):
                nomes = dict(Schedule.STATUS_CHOICES)
                raise serializers.ValidationError({"status": (
                    f"Um horário {nomes.get(instance.status, instance.status).lower()} não pode passar para "
                    f"{nomes.get(data['status'], data['status']).lower()}."
                )})

    def validate(self, data):
        instance = self.instance
        self._validar_status(data, instance)

        if instance and not any(field in data for field in ('barber', 'start_time', 'service', 'date')):
            return data

        barber = data.get('barber', instance.barber if instance else None)
        start_time = data.get('start_time', instance.start_time if instance else None)
        service = data.get('service', instance.service if instance else None)
        date = data.get('date', instance.date if instance else None)
        status = data.get('status', instance.status if instance else 'agendado')

        if not all([barber, start_time, date]):
            return data

        if not instance and date < timezone.localdate():
            raise serializers.ValidationError({"date": "Não é possível agendar para uma data passada."})

        if not instance:
            agora = timezone.localtime()
            if date == agora.date() and start_time <= agora.time():
                raise serializers.ValidationError({"start_time": "Não é possível adicionar um horário que já passou."})

        if service and service.barber_id != barber.id:
            raise serializers.ValidationError({"service": "Este serviço não pertence ao barbeiro selecionado."})

        if Vacation.objects.filter(barber=barber, start_date__lte=date, end_date__gte=date).exists():
            raise serializers.ValidationError({"date": "O barbeiro está de férias nesta data."})

        self._verificar_horario(barber, date, start_time, service, instance)
        return data

    def _verificar_horario(self, barber, date, start_time, service, instance=None):
        # bloqueio sem serviço ocupa 30 minutos
        if service:
            duration = service.duration.total_seconds() / 60
        else:
            duration = 30

        start_time_obj = timedelta(hours=start_time.hour, minutes=start_time.minute)
        end_time_obj = start_time_obj + timedelta(minutes=duration)

        work_start = timedelta(hours=barber.work_start.hour, minutes=barber.work_start.minute)
        work_end = timedelta(hours=barber.work_end.hour, minutes=barber.work_end.minute)
        if start_time_obj < work_start or end_time_obj > work_end:
            raise serializers.ValidationError({"start_time": "O horário está fora do expediente do barbeiro."})

        if barber.break_start and barber.break_end:
            break_start = timedelta(hours=barber.break_start.hour, minutes=barber.break_start.minute)
            break_end = timedelta(hours=barber.break_end.hour, minutes=barber.break_end.minute)
            if start_time_obj < break_end and end_time_obj > break_start:
                raise serializers.ValidationError({"start_time": "O horário coincide com o intervalo do barbeiro."})

        min_interval = timedelta(minutes=INTERVALO_ENTRE_ATENDIMENTOS_MIN)

        conflicting = Schedule.objects.filter(
             barber=barber,
             date=date
        ).exclude(id=instance.id if instance else None).exclude(status='cancelado')

        for schedule in conflicting:
            existing_start = timedelta(hours=schedule.start_time.hour, minutes=schedule.start_time.minute)
            existing_end = timedelta(hours=schedule.end_time.hour, minutes=schedule.end_time.minute)

            if (start_time_obj < existing_end + min_interval and end_time_obj > existing_start):
                raise serializers.ValidationError(
                    "Horário conflita com outro agendamento ou bloqueio."
                )

    def _travar_agenda(self, barber, date, start_time, service, instance=None):
        """Bloqueia a agenda do barbeiro até o fim da transação e confere o conflito de novo.

        Sem isso, duas requisições simultâneas para o mesmo horário poderiam passar pela
        validação ao mesmo tempo e gravar dois agendamentos.
        """
        Barber.objects.select_for_update().get(pk=barber.pk)
        self._verificar_horario(barber, date, start_time, service, instance)

    def create(self, validated_data):
        validated_data.pop('payment_method', None)

        request = self.context.get('request')
        user = request.user

        is_barber = Barber.objects.filter(user=user).exists()
        status = validated_data.get('status', 'agendado')

        if is_barber:
            # o barbeiro escolhe o cliente; só o bloqueio de horário fica sem cliente
            if status != 'bloqueado' and not validated_data.get('client_name'):
                raise serializers.ValidationError({"client_name": "Selecione um cliente."})
        else:
            # o cliente só agenda para si mesmo
            client = Client.objects.filter(user=user).first()
            if not client:
                raise serializers.ValidationError({"detail": "Esta conta não possui um perfil de cliente."})
            validated_data['client_name'] = client

        with transaction.atomic():
            self._travar_agenda(validated_data['barber'], validated_data['date'], validated_data['start_time'],
                                validated_data.get('service'))
            schedule = super().create(validated_data)

        data_agendamento = schedule.date.strftime('%d/%m/%Y')
        horario_agendamento = schedule.start_time.strftime('%H:%M')
        servico_nome = schedule.service.name if schedule.service else 'bloqueio de agenda'
        if schedule.client_name:
            notify_client(
                schedule.client_name,
                f"Agendamento confirmado com {schedule.barber.name} em {data_agendamento} às {horario_agendamento}.",
            )
            if not is_barber:
                notify_barber(
                    schedule.barber,
                    f"Novo agendamento: {schedule.client_name.name} marcou {servico_nome} em {data_agendamento} às {horario_agendamento}.",
                )

        if schedule.client_name:
            send_mail(
                subject="Confirmação de Agendamento",
                message=(
                    f"Olá, {schedule.client_name.name}!\n\n"
                    f"Seu agendamento foi confirmado.\n"
                    f"Barbeiro: {schedule.barber.name}\n"
                    f"Serviço: {schedule.service.name if schedule.service else 'Bloqueio de Agenda'}\n"
                    f"Data: {schedule.date.strftime('%d/%m/%Y')}\n"
                    f"Horário: {schedule.start_time.strftime('%H:%M')}\n\n"
                    f"Obrigado por escolher nossa barbearia!"
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[schedule.client_name.email],
                fail_silently=True,
            )

        return schedule

    def update(self, instance, validated_data):
        old_status = instance.status
        payment_method = validated_data.pop('payment_method', None)

        if any(campo in validated_data for campo in ('barber', 'start_time', 'service', 'date')):
            # remarcação: mesma proteção contra duas requisições simultâneas da criação
            with transaction.atomic():
                self._travar_agenda(validated_data.get('barber', instance.barber),
                                    validated_data.get('date', instance.date),
                                    validated_data.get('start_time', instance.start_time),
                                    validated_data.get('service', instance.service), instance)
                instance = super().update(instance, validated_data)
        else:
            instance = super().update(instance, validated_data)

        if instance.status == "concluido" and old_status != "concluido":
            Finances.objects.create(
                barber=instance.barber,
                schedule=instance,
                date=instance.date,
                tipo="entrada",
                payment_method=payment_method,
            )

            if instance.client_name:
                notify_client(
                    instance.client_name,
                    f"Seu atendimento com {instance.barber.name} foi concluído. Avalie sua experiência.",
                )

        if instance.status == "cancelado" and old_status != "cancelado":
            remover_lembretes(instance)
            avisar_lista_de_espera(instance)

        if instance.status == "cancelado" and old_status != "cancelado" and instance.client_name:
            notify_client(
                instance.client_name,
                f"Seu agendamento com {instance.barber.name} em {instance.date.strftime('%d/%m/%Y')} foi cancelado pelo barbeiro.",
            )

        return instance