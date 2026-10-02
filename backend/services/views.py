from rest_framework import generics, permissions
from .models import Services
from .serializers import ServicesSerializer
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

class IsBarberOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow barbers or admins to edit services.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        try:
            # Check if user has a Barber profile
            _ = request.user.barber
            return True
        except AttributeError:
            return False

class ServicesCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ServicesSerializer

    def get_queryset(self):
        queryset = Services.objects.all()
        barber_id = self.request.query_params.get('barber_id')

        if barber_id:
            return queryset.filter(barber_id=barber_id)

        user = self.request.user
        if user.is_authenticated:
            try:
                # If the user is a barber, they only see their own services in the list
                return queryset.filter(barber=user.barber)
            except AttributeError:
                # If user is not a barber (e.g. client), they see all global services
                # unless they filtered by barber_id
                pass

        return queryset

    def perform_create(self, serializer):
        # Automatically assign the service to the logged-in barber
        try:
            serializer.save(barber=self.request.user.barber)
        except AttributeError:
            # If user is not a barber, this should have been caught by permissions
            # but we handle it here just in case
            serializer.save()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBarberOrAdmin()]
        return super().get_permissions()

class ServicesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsBarberOrAdmin]
    serializer_class = ServicesSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Services.objects.all()
        try:
            # Only return services belonging to the authenticated barber
            return Services.objects.filter(barber=user.barber)
        except AttributeError:
            # Not a barber, return nothing
            return Services.objects.none()
