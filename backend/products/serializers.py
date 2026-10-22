from rest_framework import serializers
from .models import Product
from django.db import transaction
from stock.models import Stock, StockMovement
from barber.models import Barber
from finance.services import registrar_compra_de_produto

class ProductSerializer(serializers.ModelSerializer):
    initial_quantity = serializers.IntegerField(write_only=True, required=False, min_value=0, default=0)
    # quanto a barbearia pagou pelo estoque inicial; vira uma saída no financeiro
    custo_total = serializers.DecimalField(write_only=True, required=False, max_digits=10, decimal_places=2, min_value=0)

    class Meta:
        model = Product
        fields = "__all__"

    def validate(self, data):
        if data.get("custo_total") and not data.get("initial_quantity"):
            raise serializers.ValidationError({"custo_total": "Informe a quantidade comprada para lançar o custo."})
        return data

    def create(self, validated_data):
        initial_quantity = validated_data.pop("initial_quantity", 0)
        custo_total = validated_data.pop("custo_total", None)
        request = self.context.get("request")
        barbeiro = Barber.objects.filter(user=request.user).first() if request else None
        with transaction.atomic():
            product = Product.objects.create(**validated_data)
            Stock.objects.create(product=product, quantity=0)
            if initial_quantity:
                # a entrada fica no histórico e o sinal de StockMovement atualiza a quantidade
                StockMovement.objects.create(product=product, type="entrada", quantity=initial_quantity, description="Estoque inicial")
            if custo_total:
                registrar_compra_de_produto(product, initial_quantity, custo_total, barbeiro)
        return product
