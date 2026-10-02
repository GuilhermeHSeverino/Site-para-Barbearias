from rest_framework import generics
from django.db.models import F
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StockMovement, Stock
from .serializers import StockSerializer, StockMovementSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from products.models import Product
from notifications.models import Notification
from barber.models import Barber


class IsBarberOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.is_staff or Barber.objects.filter(user=request.user).exists()
        ))

class StockCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Stock.objects.all()
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
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBarberOrAdmin()]
        return super().get_permissions()

class StockAlertView(generics.GenericAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        # Retorna produtos onde a quantidade em estoque é menor ou igual ao estoque mínimo
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