from rest_framework import serializers
from .models import Store

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'
    def create(self, validated_data):
            # Obtém a quantidade vendida
            quantity = validated_data.get('quantity_sold', 0)
            
            # Cria a instância do modelo Store
            store = Store.objects.create(**validated_data)
            
            # Chama o método `sell_product` para ajustar o estoque
            store.sell_product(quantity)
            
            return store
        
    def update(self, instance, validated_data):
            # Atualiza os dados da instância
            quantity = validated_data.get('quantity_sold', instance.quantity_sold)
            
            # Chama o método `sell_product` para ajustar o estoque
            instance.sell_product(quantity)
            
            return super().update(instance, validated_data)
