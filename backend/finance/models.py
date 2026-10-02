from django.db import models
from barber.models import Barber
from schedule.models import Schedule
from store.models import Store

class Finances(models.Model):
    ENTRADA = 'entrada'
    SAIDA = 'saida'

    TIPO_CHOICES = [
        (ENTRADA, 'Entrada'),
        (SAIDA, 'Saída'),
    ]

    PAYMENT_CHOICES = [
        ('dinheiro', 'Dinheiro'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
        ('pix', 'Pix'),
    ]

    CATEGORIA_CHOICES = [
        ('aluguel', 'Aluguel'),
        ('produtos', 'Produtos/Insumos'),
        ('utilidades', 'Luz/Água/Internet'),
        ('marketing', 'Marketing'),
        ('outros', 'Outros'),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, blank=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, null=True, blank=True)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, null=True, blank=True)

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default=ENTRADA)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, null=True, blank=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.tipo == self.ENTRADA and self.schedule:
            total = 0
            if self.schedule.service:
                total += self.schedule.service.price
            self.valor = total
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tipo.upper()} - R$ {self.valor} - {self.date}"