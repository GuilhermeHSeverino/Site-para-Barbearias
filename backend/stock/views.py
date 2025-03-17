from rest_framework import generics
from .models import Stock
from .serializers import StockSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser

class StockCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

class StockRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
