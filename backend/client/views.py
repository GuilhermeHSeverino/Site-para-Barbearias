from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Client, BarberClientNote
from .serializers import ClientSerializer, BarberClientNoteSerializer
from schedule.models import Schedule

class IsBarber(permissions.BasePermission):
    """
    Custom permission to ensure the user is a barber.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        try:
            _ = request.user.barber
            return True
        except AttributeError:
            return False


class TemPerfilDeBarbeiro(permissions.BasePermission):
    """Notas e histórico são do barbeiro logado; um administrador sem perfil de barbeiro não tem os dele."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, "barber"))


class ClientCreateListView(generics.ListCreateAPIView):
    # dados pessoais dos clientes (e-mail e telefone) são só para a barbearia
    permission_classes = [IsBarber]
    serializer_class = ClientSerializer

    def get_queryset(self):
        # select_related evita uma consulta extra por cliente para ler o usuário
        queryset = Client.objects.select_related("user")
        barber_id = self.request.query_params.get('barber_id')

        if barber_id:
            if not barber_id.isdigit():
                raise ValidationError({"barber_id": "Informe um barbeiro válido."})
            # Filter clients who have had at least one appointment with this barber
            return queryset.filter(schedule__barber_id=barber_id).distinct()

        return queryset

class ClientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsBarber]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class BarberClientNoteListView(generics.ListAPIView):
    permission_classes = [TemPerfilDeBarbeiro]
    serializer_class = BarberClientNoteSerializer

    def get_queryset(self):
        return BarberClientNote.objects.filter(barber=self.request.user.barber)

class BarberClientNoteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [TemPerfilDeBarbeiro]
    serializer_class = BarberClientNoteSerializer

    def get_queryset(self):
        return BarberClientNote.objects.filter(barber=self.request.user.barber)

    def perform_create(self, serializer):
        serializer.save(barber=self.request.user.barber)

class BarberClientNoteCreateView(generics.CreateAPIView):
    permission_classes = [TemPerfilDeBarbeiro]
    serializer_class = BarberClientNoteSerializer

    def perform_create(self, serializer):
        serializer.save(barber=self.request.user.barber)

class ClientHistoryView(generics.ListAPIView):
    permission_classes = [TemPerfilDeBarbeiro]

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
