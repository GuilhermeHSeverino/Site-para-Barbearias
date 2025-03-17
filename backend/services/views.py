from rest_framework import generics
from .models import Services
from .serializers import ServicesSerializer
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

class ServicesCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly,]
    queryset = Services.objects.all()
    serializer_class = ServicesSerializer

class ServicesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Services.objects.all()
    serializer_class = ServicesSerializer
