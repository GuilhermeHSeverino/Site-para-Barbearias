from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from barber.models import Barber
from django.contrib.auth.models import User

class Review(models.Model):
    barber = models.ForeignKey(Barber, on_delete=models.PROTECT,related_name='reviews')
    comment = models.TextField(max_length=500,null=True, blank=True)
    rating = models.IntegerField(
        validators= [
            MaxValueValidator(10),
            MinValueValidator(1)
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.barber.name 
    