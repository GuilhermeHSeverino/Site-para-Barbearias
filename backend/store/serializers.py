from rest_framework import serializers
from .models import Store

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'

    # usado só pelas rotas de administrador de /stores/; o fluxo da loja fica em store/views.py
    def create(self, validated_data):
        store = Store.objects.create(**validated_data)
        store.sell_product(validated_data.get('quantity_sold', 0))
        return store

    def update(self, instance, validated_data):
        instance.sell_product(validated_data.get('quantity_sold', instance.quantity_sold))
        return super().update(instance, validated_data)
