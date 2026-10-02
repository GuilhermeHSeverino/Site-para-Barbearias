from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Schedule, Vacation, WaitlistEntry
from .serializers import ScheduleSerializer
from barber.models import Barber
from client.models import Client
from services.models import Services

class ScheduleCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        user = self.request.user

        # BARBEIRO
        if Barber.objects.filter(user=user).exists():
            barber = Barber.objects.get(user=user)
            return Schedule.objects.filter(barber=barber)\
                .select_related('barber', 'service', 'client_name')\
                .order_by('date', 'start_time')

        # CLIENTE
        if Client.objects.filter(user=user).exists():
            client = Client.objects.get(user=user)
            return Schedule.objects.filter(client_name=client)\
                .select_related('barber', 'service', 'client_name')\
                .order_by('date', 'start_time')

        return Schedule.objects.none()

    def perform_create(self, serializer):
        serializer.save()


class ScheduleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        user = self.request.user

        if Barber.objects.filter(user=user).exists():
            barber = Barber.objects.get(user=user)
            return Schedule.objects.filter(barber=barber)

        return Schedule.objects.none()


class ScheduleClientCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem cancelar cortes."}, status=403)
        try:
            schedule = Schedule.objects.get(id=pk, client_name=client)
        except Schedule.DoesNotExist:
            return Response({"detail": "Agendamento não encontrado."}, status=404)
        if schedule.status not in ["agendado", "confirmado"]:
            return Response({"detail": "Este agendamento não pode mais ser cancelado."}, status=400)
        schedule.status = "cancelado"
        schedule.save(update_fields=["status"])
        from notifications.models import ClientNotification, Notification
        entries = WaitlistEntry.objects.filter(barber=schedule.barber, service=schedule.service, date=schedule.date, status="pending").select_related("client")
        for entry in entries:
            ClientNotification.objects.create(client=entry.client, message=f"Surgiu uma possibilidade de horário com {schedule.barber.name} em {schedule.date.strftime('%d/%m/%Y')}. Confira a agenda.")
            Notification.objects.create(barber=schedule.barber, message=f"A lista de espera tem um cliente interessado em {schedule.date.strftime('%d/%m/%Y')}.", type="SYSTEM")
            entry.status = "notified"
            entry.save(update_fields=["status"])
        return Response({"id": schedule.id, "status": schedule.status})


class ScheduleAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barber_id = request.query_params.get("barber_id")
        service_id = request.query_params.get("service_id")
        date_value = request.query_params.get("date")

        if not all([barber_id, service_id, date_value]):
            return Response({"detail": "barber_id, service_id e date são obrigatórios."}, status=400)

        try:
            barber = Barber.objects.get(id=barber_id)
            service = Services.objects.get(id=service_id, barber=barber)
            selected_date = datetime.strptime(date_value, "%Y-%m-%d").date()
        except (Barber.DoesNotExist, Services.DoesNotExist):
            return Response({"detail": "Barbeiro ou serviço não encontrado."}, status=404)
        except ValueError:
            return Response({"detail": "Data inválida."}, status=400)

        if selected_date < timezone.now().date():
            return Response({"detail": "Não é possível consultar uma data passada."}, status=400)

        if Vacation.objects.filter(barber=barber, start_date__lte=selected_date, end_date__gte=selected_date).exists():
            return Response({"slots": [], "vacation": True})

        def minutos(horario):
            return horario.hour * 60 + horario.minute

        inicio_jornada = minutos(barber.work_start)
        fim_jornada = minutos(barber.work_end)
        inicio_intervalo = minutos(barber.break_start) if barber.break_start else None
        fim_intervalo = minutos(barber.break_end) if barber.break_end else None
        duracao = int(service.duration.total_seconds() // 60)

        ocupados = Schedule.objects.filter(
            barber=barber,
            date=selected_date,
        ).exclude(status="cancelado")

        slots = []
        for inicio in range(inicio_jornada, fim_jornada, 30):
            fim = inicio + duracao
            dentro_do_intervalo = (
                inicio_intervalo is not None and fim_intervalo is not None and
                inicio < fim_intervalo and fim > inicio_intervalo
            )

            conflita = False
            if fim > fim_jornada or dentro_do_intervalo:
                conflita = True
            else:
                for agendamento in ocupados:
                    ocupado_inicio = minutos(agendamento.start_time)
                    ocupado_fim = minutos(agendamento.end_time)
                    if inicio < ocupado_fim + 8 and fim > ocupado_inicio:
                        conflita = True
                        break

            if not conflita:
                slots.append({"time": f"{inicio // 60:02d}:{inicio % 60:02d}"})

        return Response({"slots": slots})


class VacationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem bloquear férias."}, status=403)

        month = request.data.get("month")
        if not month:
            return Response({"detail": "Informe o mês das férias."}, status=400)

        try:
            year, month_number = [int(value) for value in month.split("-")]
            from calendar import monthrange
            start_date = datetime(year, month_number, 1).date()
            end_date = datetime(year, month_number, monthrange(year, month_number)[1]).date()
        except (ValueError, TypeError):
            return Response({"detail": "Mês inválido."}, status=400)

        if end_date < timezone.now().date():
            return Response({"detail": "Escolha um mês atual ou futuro."}, status=400)

        vacation, created = Vacation.objects.get_or_create(
            barber=barber,
            start_date=start_date,
            end_date=end_date,
        )
        return Response({"id": vacation.id, "start_date": vacation.start_date, "end_date": vacation.end_date}, status=201 if created else 200)


class WaitlistCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem entrar na lista de espera."}, status=403)
        try:
            barber = Barber.objects.get(id=request.data.get("barber"))
            service = Services.objects.get(id=request.data.get("service"), barber=barber)
            date_value = datetime.strptime(request.data.get("date"), "%Y-%m-%d").date()
        except (Barber.DoesNotExist, Services.DoesNotExist):
            return Response({"detail": "Barbeiro ou serviço não encontrado."}, status=404)
        except (TypeError, ValueError):
            return Response({"detail": "Data inválida."}, status=400)
        entry, created = WaitlistEntry.objects.get_or_create(client=client, barber=barber, service=service, date=date_value)
        return Response({"id": entry.id, "status": entry.status}, status=201 if created else 200)


class WaitlistListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem ver a lista de espera."}, status=403)
        entries = WaitlistEntry.objects.filter(barber=barber, status="pending").select_related("client", "service")
        return Response([{"id": entry.id, "client": entry.client.name, "service": entry.service.name, "date": entry.date} for entry in entries])