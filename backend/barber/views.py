from rest_framework import generics
from .models import Barber
from .serializers import BarberSerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

class BarberCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Barber.objects.select_related("user")
    serializer_class = BarberSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return super().get_permissions()

class BarberRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser,]
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer

class BarberProfileUpdateView(generics.RetrieveUpdateAPIView):
    """O barbeiro logado consulta e altera o próprio perfil (dados, bio e horários)."""
    permission_classes = [IsAuthenticated]
    serializer_class = BarberSerializer

    def get_object(self):
        return get_object_or_404(Barber, user=self.request.user)
