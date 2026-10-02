from rest_framework import serializers
from .models import Stock, StockMovement

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

    class Meta:
        model = StockMovement
        fields = "__all__"

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantidade deve ser maior que zero.")
        return value