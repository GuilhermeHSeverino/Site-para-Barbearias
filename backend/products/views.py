from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer
from rest_framework.permissions import  IsAdminUser, IsAuthenticatedOrReadOnly


class ProductCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer