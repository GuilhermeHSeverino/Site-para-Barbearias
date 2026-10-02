from django.db import models
from django.contrib.auth.models import User

class Client(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    user = models.OneToOneField(User,on_delete=models.CASCADE,unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class BarberClientNote(models.Model):
    barber = models.ForeignKey('barber.Barber', on_delete=models.CASCADE, related_name='client_notes')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='barber_notes')
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('barber', 'client')
        verbose_name = "Nota do Barbeiro sobre Cliente"
        verbose_name_plural = "Notas dos Barbeiros sobre Clientes"

    def __str__(self):
        return f"Nota de {self.barber} para {self.client}"
