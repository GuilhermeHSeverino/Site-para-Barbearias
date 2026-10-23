from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticatedOrReadOnly

from app.permissoes import IsBarberOrAdmin


class ProductCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        # cadastrar produto é tarefa de barbeiro ou administrador, não de cliente
        if self.request.method == "POST":
            return [IsBarberOrAdmin()]
        return super().get_permissions()

class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBarberOrAdmin()]
        return super().get_permissions()