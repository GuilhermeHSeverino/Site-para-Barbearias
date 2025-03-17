from rest_framework import generics
from .models import Barber
from .serializers import BarberSerializer
from rest_framework.permissions import  IsAdminUser, IsAuthenticatedOrReadOnly

class BarberCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer

class BarberRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer
