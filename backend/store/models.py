from django.db import models
from stock.models import Stock
from client.models import Client
from barber.models import Barber

class Store(models.Model):
    PAYMENT_CHOICES = [('retirada', 'Pagar na retirada')]
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE,related_name='store')
    client = models.ForeignKey(Client, on_delete=models.CASCADE,related_name='store')
    barber = models.ForeignKey(Barber, on_delete=models.PROTECT, related_name='store_orders', null=True, blank=True)
    quantity_sold = models.IntegerField(default=0)
    date_of_sale = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=12, choices=[('pendente', 'Pendente'), ('entregue', 'Entregue'), ('cancelado', 'Cancelado')], default='pendente')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='retirada')


    def sell_product(self,quantity):
        if self.stock.quantity >= quantity:
            self.stock.quantity -= quantity
            self.stock.save()
            self.quantity_sold += quantity
            self.save()
        else :
            raise ValueError('Quantidade insuficiente em estoque')
        
    def __str__(self):
        return f'{self.stock} - {self.quantity_sold} - {self.date_of_sale}'