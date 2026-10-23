from django.db import models
from django.contrib.auth.models import User

class Barber(models.Model):
    name = models.CharField("Nome", max_length=100)
    email = models.EmailField("E-mail", unique=True)
    phone = models.CharField("Telefone", max_length=20)
    user = models.OneToOneField(User,on_delete=models.CASCADE,unique=True, verbose_name="Usuário")

    # Perfil Profissional
    photo = models.ImageField("Foto", upload_to='barbers/photos/', null=True, blank=True)
    bio = models.TextField("Sobre", blank=True)
    specialties = models.TextField("Especialidades", blank=True)

    # Horários de Trabalho
    work_start = models.TimeField("Início do expediente", default="08:00")
    work_end = models.TimeField("Fim do expediente", default="20:00")
    break_start = models.TimeField("Início do intervalo", default="12:00")
    break_end = models.TimeField("Fim do intervalo", default="13:00")

    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Barbeiro"
        verbose_name_plural = "Barbeiros"

    def __str__(self):
        return self.name