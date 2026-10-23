from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from app.permissoes import IsBarberOrAdmin
from .models import Services
from .serializers import ServicesSerializer


class ServicesCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ServicesSerializer

    def get_queryset(self):
        queryset = Services.objects.all()
        barber_id = self.request.query_params.get('barber_id')

        if barber_id:
            if not barber_id.isdigit():
                raise ValidationError({"barber_id": "Informe um barbeiro válido."})
            return queryset.filter(barber_id=barber_id)

        # o barbeiro vê só os próprios serviços; o cliente vê todos, ou os do barbeiro escolhido
        user = self.request.user
        if user.is_authenticated and hasattr(user, "barber"):
            return queryset.filter(barber=user.barber)
        return queryset

    def perform_create(self, serializer):
        # o serviço sempre pertence ao barbeiro logado
        serializer.save(barber=getattr(self.request.user, "barber", None))

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBarberOrAdmin()]
        return super().get_permissions()


class ServicesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsBarberOrAdmin]
    serializer_class = ServicesSerializer

    def get_queryset(self):
        # o barbeiro só altera os próprios serviços; o administrador, todos
        user = self.request.user
        if user.is_staff:
            return Services.objects.all()
        return Services.objects.filter(barber=user.barber)
