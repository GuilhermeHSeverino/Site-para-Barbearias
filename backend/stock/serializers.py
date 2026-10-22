from django.db import transaction
from rest_framework import serializers
from .models import Stock, StockMovement
from barber.models import Barber
from finance.services import registrar_compra_de_produto

class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(source="product.price", max_digits=6, decimal_places=2, read_only=True)
    product_estoque_minimo = serializers.IntegerField(source="product.estoque_minimo", read_only=True)
    product_disponivel_na_loja = serializers.BooleanField(source="product.disponivel_na_loja", read_only=True)

    class Meta:
        model = Stock
        fields = "__all__"

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    # quanto a barbearia pagou na compra (só em entradas); vira uma saída no financeiro
    custo_total = serializers.DecimalField(write_only=True, required=False, max_digits=10, decimal_places=2, min_value=0)

    class Meta:
        model = StockMovement
        fields = "__all__"

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantidade deve ser maior que zero.")
        return value

    def validate(self, data):
        if data.get("type") == "saida":
            stock = Stock.objects.filter(product=data["product"]).first()
            if not stock or stock.quantity < data["quantity"]:
                raise serializers.ValidationError({"quantity": "Estoque insuficiente para esta saída."})
        if data.get("custo_total") and data.get("type") != "entrada":
            raise serializers.ValidationError({"custo_total": "O custo de compra só pode ser informado em entradas."})
        return data

    def create(self, validated_data):
        custo_total = validated_data.pop("custo_total", None)
        request = self.context.get("request")
        barbeiro = Barber.objects.filter(user=request.user).first() if request else None
        with transaction.atomic():
            movimento = super().create(validated_data)
            if movimento.type == "saida":
                from notifications.services import avisar_estoque_baixo
                avisar_estoque_baixo(barbeiro, Stock.objects.select_related("product").get(product=movimento.product))
            if custo_total:
                registrar_compra_de_produto(movimento.product, movimento.quantity, custo_total, barbeiro)
        return movimento