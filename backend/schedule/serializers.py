from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import serializers
from .models import Schedule

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"
        read_only_fields = ['end_time']

    def validate(self, data):
        """
        Validação para garantir que não haja conflito de horário com outros agendamentos.
        """
        barber = data.get('barber')
        start_time = data.get('start_time')
        service = data.get('service')  # Obtém o serviço para calcular a duração
        duration = service.duration.total_seconds() / 60  # A duração do serviço em minutos

        # Converte o start_time para timedelta para poder somar a duração
        start_time_obj = timedelta(hours=start_time.hour, minutes=start_time.minute)
        end_time_obj = start_time_obj + timedelta(minutes=duration)  # Adiciona a duração ao horário de início
        end_time = (datetime.min + end_time_obj).time()  # Converte para o formato correto

        # Intervalo mínimo entre agendamentos
        min_interval = timedelta(minutes=8)

        # Verificar se já existe um agendamento conflitante
        conflicting_schedule = Schedule.objects.filter(
            barber=barber,
            date=data.get('date')
        ).exclude(id=self.instance.id if self.instance else None)  # Ignora o próprio agendamento sendo atualizado

        for schedule in conflicting_schedule:
            # Converte o horário de início e fim de cada agendamento existente para timedelta
            existing_start_time_obj = timedelta(hours=schedule.start_time.hour, minutes=schedule.start_time.minute)
            existing_end_time_obj = timedelta(hours=schedule.end_time.hour, minutes=schedule.end_time.minute)

            # Checa se há sobreposição de horários considerando o intervalo mínimo
            if (start_time_obj < existing_end_time_obj + min_interval and end_time_obj > existing_start_time_obj):
                raise serializers.ValidationError(
                    "Horário conflita com outro agendamento. Adicione um intervalo de 8 minutos."
                )

        return data
    
    def create(self, validated_data):
        schedule = super().create(validated_data)

        # Envio do e-mail
        client_email = schedule.client_name.email  # Supõe que o agendamento tem um campo relacionado ao cliente
        barber_name = schedule.barber.name
        service_name = schedule.service.name
        start_time = schedule.start_time.strftime('%H:%M')
        date = schedule.date.strftime('%d/%m/%Y')

        send_mail(
            subject="Confirmação de Agendamento",
            message=(
                f"Olá, {schedule.client_name.name}!\n\n"
                f"Seu agendamento foi confirmado.\n"
                f"Barbeiro: {barber_name}\n"
                f"Serviço: {service_name}\n"
                f"Data: {date}\n"
                f"Horário: {start_time}\n\n"
                f"Obrigado por escolher nossa barbearia!"
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[client_email],
            fail_silently=False,
        )

        return schedule