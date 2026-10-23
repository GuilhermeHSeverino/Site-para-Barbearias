from rest_framework.permissions import BasePermission


class IsBarberOrAdmin(BasePermission):
    """Libera barbeiros e administradores. Sem login a resposta é 401; um cliente recebe 403."""

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and (usuario.is_staff or hasattr(usuario, "barber")))


class HasBarberProfile(BasePermission):
    """Exige o perfil de barbeiro, para dados que pertencem ao barbeiro logado (notas, histórico)."""

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and hasattr(usuario, "barber"))
