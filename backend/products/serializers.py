from rest_framework import serializers
from .models import Product
from django.db import transaction
from stock.models import Stock

class ProductSerializer(serializers.ModelSerializer):
    initial_quantity = serializers.IntegerField(write_only=True, required=False, min_value=0, default=0)

    class Meta:
        model = Product
        fields = "__all__"

    def create(self, validated_data):
        initial_quantity = validated_data.pop("initial_quantity", 0)
        with transaction.atomic():
            product = Product.objects.create(**validated_data)
            Stock.objects.create(product=product, quantity=initial_quantity)
        return product

        