from rest_framework import generics
from .models import Client
from .serializers import ClientSerializer
from rest_framework.permissions import  AllowAny,IsAuthenticated

class ClientCreateListView(generics.ListCreateAPIView):
    permission_classes = [AllowAny,]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    def get_queryset(self):
        # Protege a listagem de clientes; apenas usuários autenticados podem ver
        if self.request.user.is_authenticated:
            return super().get_queryset()
        return Client.objects.none()

class ClientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
