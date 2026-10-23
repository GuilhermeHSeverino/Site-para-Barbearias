from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from app.permissoes import HasBarberProfile, IsBarberOrAdmin
from schedule.models import Schedule
from .models import Client, BarberClientNote
from .serializers import ClientSerializer, BarberClientNoteSerializer


class ClientCreateListView(generics.ListCreateAPIView):
    # dados pessoais dos clientes (e-mail e telefone) são só para a barbearia
    permission_classes = [IsBarberOrAdmin]
    serializer_class = ClientSerializer

    def get_queryset(self):
        # select_related evita uma consulta extra por cliente para ler o usuário
        queryset = Client.objects.select_related("user")
        barber_id = self.request.query_params.get('barber_id')

        if barber_id:
            if not barber_id.isdigit():
                raise ValidationError({"barber_id": "Informe um barbeiro válido."})
            # clientes que já tiveram pelo menos um atendimento com esse barbeiro
            return queryset.filter(schedule__barber_id=barber_id).distinct()

        return queryset

class ClientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsBarberOrAdmin]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class BarberClientNoteListView(generics.ListAPIView):
    permission_classes = [HasBarberProfile]
    serializer_class = BarberClientNoteSerializer

    def get_queryset(self):
        return BarberClientNote.objects.filter(barber=self.request.user.barber)

class BarberClientNoteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [HasBarberProfile]
    serializer_class = BarberClientNoteSerializer

    def get_queryset(self):
        return BarberClientNote.objects.filter(barber=self.request.user.barber)

class BarberClientNoteCreateView(generics.CreateAPIView):
    permission_classes = [HasBarberProfile]
    serializer_class = BarberClientNoteSerializer

    def perform_create(self, serializer):
        serializer.save(barber=self.request.user.barber)

class ClientHistoryView(generics.ListAPIView):
    permission_classes = [HasBarberProfile]

    def get_queryset(self):
        client_id = self.kwargs.get('client_id')
        barber = self.request.user.barber
        return Schedule.objects.filter(
            client_name_id=client_id,
            barber=barber
        ).order_by('-date', '-start_time')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for s in queryset:
            data.append({
                "id": s.id,
                "date": s.date,
                "start_time": s.start_time,
                "service": s.service.name if s.service else "Atendimento",
                "status": s.status
            })
        return Response(data)
