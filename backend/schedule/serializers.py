from datetime import timedelta
from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from .models import Schedule, Vacation
from client.models import Client
from barber.models import Barber
from finance.models import Finances


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

    # 🔥 VALIDAÇÃO (mantida igual)
    def validate(self, data):
        instance = self.instance

        if instance and not any(field in data for field in ('barber', 'start_time', 'service', 'date')):
            return data

        barber = data.get('barber', instance.barber if instance else None)
        start_time = data.get('start_time', instance.start_time if instance else None)
        service = data.get('service', instance.service if instance else None)
        date = data.get('date', instance.date if instance else None)
        status = data.get('status', instance.status if instance else 'agendado')

        if not all([barber, start_time, date]):
            return data

        if not instance and date < timezone.now().date():
            raise serializers.ValidationError({"date": "Não é possível agendar para uma data passada."})

        if Vacation.objects.filter(barber=barber, start_date__lte=date, end_date__gte=date).exists():
            raise serializers.ValidationError({"date": "O barbeiro está de férias nesta data."})

        # Calculate duration based on service or a default for blocked hours
        if service:
            duration = service.duration.total_seconds() / 60
        else:
            duration = 30  # Default 30 min for blocked hours

        start_time_obj = timedelta(hours=start_time.hour, minutes=start_time.minute)
        end_time_obj = start_time_obj + timedelta(minutes=duration)

        min_interval = timedelta(minutes=8)

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

        return data

    # 🔥 CREATE — agora aceita agendamento manual do barbeiro
    def create(self, validated_data):
        validated_data.pop('payment_method', None)

        request = self.context.get('request')
        user = request.user

        is_barber = Barber.objects.filter(user=user).exists()
        status = validated_data.get('status', 'agendado')

        if is_barber:
            # Allow missing client_name only if status is 'bloqueado'
            if status != 'bloqueado' and not validated_data.get('client_name'):
                raise serializers.ValidationError({"client_name": "Selecione um cliente."})
        else:
            # Cliente só pode agendar pra si mesmo
            client = Client.objects.filter(user=user).first()
            if not client:
                raise serializers.ValidationError({"detail": "Esta conta não possui um perfil de cliente."})
            validated_data['client_name'] = client

        schedule = super().create(validated_data)

        # Only send email if there is a client
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

    # 🔥 UPDATE — agora captura forma de pagamento ao concluir
    def update(self, instance, validated_data):
        old_status = instance.status
        payment_method = validated_data.pop('payment_method', None)

        instance = super().update(instance, validated_data)

        if instance.status == "concluido" and old_status != "concluido":
            Finances.objects.create(
                barber=instance.barber,
                schedule=instance,
                date=instance.date,
                tipo="entrada",
                payment_method=payment_method,
            )

        return instance