from django.db import models
from store.models import Store
from barber.models import Barber
from schedule.models import Schedule

class Finances(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, blank=True, null=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def save(self, *args, **kwargs):
        # Calcula o total dinamicamente
        self.total = self.schedule.service.price
        if self.store:
            self.total += self.store.stock.product.price
        super().save(*args, **kwargs)

    
