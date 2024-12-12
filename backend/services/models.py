from django.db import models

class Services(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.DurationField()
    
    def __str__(self):
        return self.name + ' - ' + self.price + ' - ' + self.duration
