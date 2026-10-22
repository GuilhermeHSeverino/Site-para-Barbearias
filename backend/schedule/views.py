from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Schedule, Vacation, WaitlistEntry, INTERVALO_ENTRE_ATENDIMENTOS_MIN
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
            queryset = Schedule.objects.filter(barber=barber)
        # CLIENTE
        elif Client.objects.filter(user=user).exists():
            client = Client.objects.get(user=user)
            queryset = Schedule.objects.filter(client_name=client)
        else:
            return Schedule.objects.none()

        # filtro opcional por período (?data_inicio=AAAA-MM-DD&data_fim=AAAA-MM-DD),
        # para as telas não precisarem baixar todo o histórico
        try:
            data_inicio = self.request.query_params.get("data_inicio")
            data_fim = self.request.query_params.get("data_fim")
            if data_inicio:
                queryset = queryset.filter(date__gte=datetime.strptime(data_inicio, "%Y-%m-%d").date())
            if data_fim:
                queryset = queryset.filter(date__lte=datetime.strptime(data_fim, "%Y-%m-%d").date())
        except ValueError:
            raise ValidationError({"detail": "Datas devem estar no formato AAAA-MM-DD."})

        return queryset.select_related('barber', 'service', 'client_name').order_by('date', 'start_time')

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
        from notifications.services import notify_barber, notify_client, remover_lembretes
        remover_lembretes(schedule)
        notify_barber(
            schedule.barber,
            f"Agendamento cancelado pelo cliente {client.name}: {schedule.date.strftime('%d/%m/%Y')} às {schedule.start_time.strftime('%H:%M')}.",
        )
        entries = WaitlistEntry.objects.filter(barber=schedule.barber, service=schedule.service, date=schedule.date, status="pending").select_related("client")
        for entry in entries:
            notify_client(entry.client, f"Surgiu uma possibilidade de horário com {schedule.barber.name} em {schedule.date.strftime('%d/%m/%Y')}. Confira a agenda.")
            notify_barber(schedule.barber, f"A lista de espera tem um cliente interessado em {schedule.date.strftime('%d/%m/%Y')}.")
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

        agora = timezone.localtime()
        hoje = agora.date()
        minutos_agora = agora.hour * 60 + agora.minute

        if selected_date < hoje:
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
            if selected_date == hoje and inicio <= minutos_agora:
                continue

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
                    if inicio < ocupado_fim + INTERVALO_ENTRE_ATENDIMENTOS_MIN and fim > ocupado_inicio:
                        conflita = True
                        break

            if not conflita:
                slots.append({"time": f"{inicio // 60:02d}:{inicio % 60:02d}"})

        return Response({"slots": slots})


class VacationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def serializar(vacation):
        return {"id": vacation.id, "start_date": vacation.start_date, "end_date": vacation.end_date}

    def get(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem consultar folgas e férias."}, status=403)
        futuras = Vacation.objects.filter(barber=barber, end_date__gte=timezone.localdate())
        return Response([self.serializar(v) for v in futuras])

    def post(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem bloquear férias."}, status=403)

        try:
            if request.data.get("month"):
                # compatibilidade: bloqueio do mês inteiro
                from calendar import monthrange
                year, month_number = [int(value) for value in request.data["month"].split("-")]
                start_date = datetime(year, month_number, 1).date()
                end_date = datetime(year, month_number, monthrange(year, month_number)[1]).date()
            else:
                start_date = datetime.strptime(request.data.get("start_date", ""), "%Y-%m-%d").date()
                end_date = datetime.strptime(request.data.get("end_date") or request.data.get("start_date", ""), "%Y-%m-%d").date()
        except (ValueError, TypeError, AttributeError):
            return Response({"detail": "Informe datas válidas para o bloqueio."}, status=400)

        hoje = timezone.localdate()
        if end_date < start_date:
            return Response({"detail": "A data final não pode ser anterior à data inicial."}, status=400)
        if end_date < hoje:
            return Response({"detail": "Escolha um período atual ou futuro."}, status=400)
        start_date = max(start_date, hoje)

        if Vacation.objects.filter(barber=barber, start_date__lte=end_date, end_date__gte=start_date).exists():
            return Response({"detail": "Já existe uma folga ou férias cobrindo parte desse período."}, status=400)

        vacation = Vacation.objects.create(barber=barber, start_date=start_date, end_date=end_date)
        # agendamentos já marcados no período não são cancelados automaticamente; o barbeiro é avisado
        afetados = Schedule.objects.filter(
            barber=barber, date__range=(start_date, end_date), status__in=["agendado", "confirmado"]
        ).select_related("client_name")
        from notifications.services import notify_client
        for s in afetados:
            if s.client_name:
                notify_client(
                    s.client_name,
                    f"{barber.name} não atenderá em {s.date.strftime('%d/%m/%Y')}. Seu horário das {s.start_time.strftime('%H:%M')} "
                    f"precisa ser remarcado: cancele-o em Agendamentos e escolha uma nova data.",
                )
        return Response({**self.serializar(vacation), "agendamentos_no_periodo": len(afetados)}, status=201)


class VacationDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = Vacation.objects.filter(id=pk, barber__user=request.user).delete()
        if not deleted:
            return Response({"detail": "Bloqueio não encontrado."}, status=404)
        return Response(status=204)


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

        if date_value < timezone.now().date():
            return Response({"detail": "Não é possível entrar na lista de espera para uma data passada."}, status=400)

        entry, created = WaitlistEntry.objects.get_or_create(client=client, barber=barber, service=service, date=date_value)
        if created:
            from notifications.services import notify_barber
            notify_barber(barber, f"{client.name} entrou na lista de espera para {service.name} em {date_value.strftime('%d/%m/%Y')}.")
        return Response({"id": entry.id, "status": entry.status}, status=201 if created else 200)


class WaitlistListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem ver a lista de espera."}, status=403)
        entries = WaitlistEntry.objects.filter(barber=barber, status="pending").select_related("client", "service")
        return Response([{"id": entry.id, "client": entry.client.name, "service": entry.service.name, "date": entry.date} for entry in entries])