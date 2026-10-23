from rest_framework import generics
from django.db.models import F
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StockMovement, Stock
from .serializers import StockSerializer, StockMovementSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response

from app.permissoes import IsBarberOrAdmin

class StockCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    # select_related evita uma consulta extra por item para ler o produto
    queryset = Stock.objects.select_related("product")
    serializer_class = StockSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBarberOrAdmin()]
        return super().get_permissions()

class StockRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

class StockMovementView(generics.ListCreateAPIView):
    # o histórico de movimentações é de uso interno da barbearia
    permission_classes = [IsBarberOrAdmin]
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer

class StockAlertView(generics.GenericAPIView):
    permission_classes = [IsBarberOrAdmin]

    def get(self, request):
        # produtos que chegaram ao estoque mínimo
        alerts = Stock.objects.filter(
            quantity__lte=F('product__estoque_minimo')
        ).select_related('product')

        data = []
        for s in alerts:
            data.append({
                "id": s.id,
                "product": s.product.name,
                "current_quantity": s.quantity,
                "min_quantity": s.product.estoque_minimo
            })
        return Response(data)

@receiver(post_save, sender=StockMovement)
def atualizar_estoque(sender, instance, created, **kwargs):
    if not created:
        return

    stock, _ = Stock.objects.get_or_create(product=instance.product)

    if instance.type == "entrada":
        stock.quantity += instance.quantity
    else:
        if stock.quantity < instance.quantity:
            raise ValueError("Estoque insuficiente")
        stock.quantity -= instance.quantity

    stock.save()