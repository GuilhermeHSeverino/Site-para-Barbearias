from django.db import models
from products.models import Product

class Stock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE,related_name="stock")
    quantity = models.IntegerField()

    def __str__(self):
        return self.product.name