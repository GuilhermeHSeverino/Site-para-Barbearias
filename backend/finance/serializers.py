from rest_framework import serializers
from .models import Finances

class FinancesSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Finances
        fields = '__all__'

    def create(self, validated_data):
        schedule = validated_data.get('schedule')
        store = validated_data.get('store', None)

        total = schedule.service.price
        if store:
            total += store.stock.product.price

        finance = Finances.objects.create(total=total, **validated_data)
        return finance
