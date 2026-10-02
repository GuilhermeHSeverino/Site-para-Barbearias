from datetime import datetime, timedelta
from django.db import models
from barber.models import Barber
from client.models import Client
from services.models import Services

class Schedule(models.Model):

    STATUS_CHOICES = [
        ('agendado', 'Agendado'),
        ('confirmado', 'Confirmado'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
        ('bloqueado', 'Bloqueado'),
    ]

    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)

    barber = models.ForeignKey(Barber, on_delete=models.PROTECT, related_name="schedule")
    client_name = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="schedule", blank=True, null=True)
    service = models.ForeignKey(Services, on_delete=models.PROTECT, related_name="schedule", blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='agendado')

    def save(self, *args, **kwargs):
        if not self.end_time:
            if self.service:
                start_time = timedelta(hours=self.start_time.hour, minutes=self.start_time.minute)
                duration = self.service.duration.total_seconds() / 60
                end_time = start_time + timedelta(minutes=duration)
                self.end_time = (datetime.min + end_time).time()
            else:
                # Default duration for blocked hours (e.g., 30 min)
                start_time = timedelta(hours=self.start_time.hour, minutes=self.start_time.minute)
                end_time = start_time + timedelta(minutes=30)
                self.end_time = (datetime.min + end_time).time()


        super().save(*args, **kwargs)


class Vacation(models.Model):
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name="vacations")
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return f"{self.barber.name}: {self.start_date} - {self.end_date}"


class WaitlistEntry(models.Model):
    STATUS_CHOICES = [("pending", "Pendente"), ("notified", "Avisado"), ("cancelled", "Cancelado")]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="waitlist_entries")
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name="waitlist_entries")
    service = models.ForeignKey(Services, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        unique_together = ("client", "barber", "service", "date")