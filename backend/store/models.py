from django.db import models
from stock.models import Stock
from client.models import Client

class Store(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE,related_name='store')
    client = models.ForeignKey(Client, on_delete=models.CASCADE,related_name='store')
    quantity_sold = models.IntegerField(default=0)
    date_of_sale = models.DateField(auto_now_add=True)


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