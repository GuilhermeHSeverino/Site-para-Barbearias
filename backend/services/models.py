from django.db import models

class Services(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.DurationField()
    barber = models.ForeignKey('barber.Barber', on_delete=models.CASCADE, related_name='services', null=True)

    def __str__(self):
        return self.name + ' - ' + str(self.price) + ' - ' + str(self.duration)
