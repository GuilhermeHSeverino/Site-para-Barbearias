from rest_framework import generics
from .models import Schedule
from .serializers import ScheduleSerializer
from rest_framework.permissions import IsAuthenticated

class ScheduleCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def perform_create(self, serializer):
        # Assumindo que o usuário autenticado tem relação com Client via OneToOneField ou ForeignKey
        client = self.request.user.client  # ajuste conforme seu relacionamento User -> Client
        serializer.save(client_name=client)

class ScheduleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
