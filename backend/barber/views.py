from rest_framework import generics
from .models import Barber
from .serializers import BarberSerializer


class BarberCreateListView(generics.ListCreateAPIView):
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer

class BarberRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer
