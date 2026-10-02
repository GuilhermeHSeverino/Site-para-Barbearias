from django.db import models
from products.models import Product

class Stock(models.Model):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name="stock"
    )

    quantity = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"
    
class StockMovement(models.Model):
    TYPE_CHOICES = (
        ("entrada", "Entrada"),
        ("saida", "Saída"),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantity = models.IntegerField()
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.type}"