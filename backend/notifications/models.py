from django.db import models
from barber.models import Barber

class Notification(models.Model):
    TYPE_CHOICES = [
        ('STOCK_LOW', 'Estoque Baixo'),
        ('SYSTEM', 'Sistema'),
    ]

    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SYSTEM')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notif for {self.barber.name}: {self.message[:30]}"


class ClientNotification(models.Model):
    client = models.ForeignKey('client.Client', on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
