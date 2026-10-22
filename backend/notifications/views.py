from rest_framework import generics, permissions
from .models import Notification, ClientNotification
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None # Defined below for simplicity

    def list(self, request, *args, **kwargs):
        from barber.models import Barber
        from .services import gerar_lembretes_barbeiro
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem ver estas notificações."}, status=403)
        gerar_lembretes_barbeiro(barber)
        queryset = Notification.objects.filter(barber=barber)[:50]
        data = []
        for n in queryset:
            data.append({
                "id": n.id,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at
            })
        return Response(data)

class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            from barber.models import Barber
            barber = Barber.objects.get(user=request.user)
            notif = Notification.objects.get(pk=pk, barber=barber)
            notif.is_read = True
            notif.save()
            return Response({"status": "marked as read"}, status=status.HTTP_200_OK)
        except (Notification.DoesNotExist, Barber.DoesNotExist):
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


class ClientNotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from client.models import Client
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem ver notificações."}, status=403)
        from .services import gerar_lembretes_cliente
        gerar_lembretes_cliente(client)
        return Response([{
            "id": item.id,
            "message": item.message,
            "is_read": item.is_read,
            "created_at": item.created_at,
        } for item in ClientNotification.objects.filter(client=client)[:20]])


class ClientNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        from client.models import Client
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem atualizar notificações."}, status=403)
        updated = ClientNotification.objects.filter(id=pk, client=client).update(is_read=True)
        if not updated:
            return Response({"detail": "Notificação não encontrada."}, status=404)
        return Response({"status": "read"})


class ClientNotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from client.models import Client
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem atualizar notificações."}, status=403)
        total = ClientNotification.objects.filter(client=client, is_read=False).update(is_read=True)
        return Response({"marcadas": total})
