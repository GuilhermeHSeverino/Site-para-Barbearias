from datetime import datetime, timedelta
from django.db import models
from barber.models import Barber
from client.models import Client
from services.models import Services

class Schedule(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    barber  = models.ForeignKey(Barber, on_delete=models.PROTECT,related_name="schedule")
    client_name = models.ForeignKey(Client, on_delete=models.PROTECT,related_name="schedule")
    service = models.ForeignKey(Services, on_delete=models.PROTECT,related_name="schedule")

    def save(self, *args, **kwargs):
        # Calcular o end_time com base no start_time e na duração do serviço
        if not self.end_time:
            start_time = timedelta(hours=self.start_time.hour, minutes=self.start_time.minute)
            # Aqui, obtemos a duração do serviço em minutos
            duration = self.service.duration.total_seconds() / 60  # Converte a duração para minutos
            duration_timedelta = timedelta(minutes=duration)  # Cria um timedelta de minutos
            end_time = (start_time + duration_timedelta)
            self.end_time = (datetime.min + end_time).time()  # Converte o time para o formato correto

        super().save(*args, **kwargs)
    