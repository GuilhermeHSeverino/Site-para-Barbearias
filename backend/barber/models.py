from django.db import models
from django.contrib.auth.models import User

class Barber(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    user = models.OneToOneField(User,on_delete=models.CASCADE,unique=True)

    # Perfil Profissional
    photo = models.ImageField(upload_to='barbers/photos/', null=True, blank=True)
    bio = models.TextField(blank=True)
    specialties = models.TextField(blank=True)

    # Horários de Trabalho
    work_start = models.TimeField(default="08:00")
    work_end = models.TimeField(default="20:00")
    break_start = models.TimeField(default="12:00")
    break_end = models.TimeField(default="13:00")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name