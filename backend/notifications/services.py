from datetime import datetime, timedelta

from django.utils import timezone

from .models import ClientNotification, Notification

# antecedência dos lembretes de atendimento
LEMBRETE_BARBEIRO_MINUTOS = 10
LEMBRETE_CLIENTE_HORAS = 24


def notify_barber(barber, message, notification_type="SYSTEM"):
    return Notification.objects.create(
        barber=barber,
        message=message,
        type=notification_type,
    )


def notify_client(client, message):
    return ClientNotification.objects.create(
        client=client,
        message=message,
    )


def _inicio(agendamento):
    return timezone.make_aware(datetime.combine(agendamento.date, agendamento.start_time))


def _proximos_atendimentos(filtro, agora, limite):
    from schedule.models import Schedule
    candidatos = (
        Schedule.objects.filter(status__in=["agendado", "confirmado"], client_name__isnull=False,
                                date__range=(agora.date(), limite.date()), **filtro)
        .select_related("barber", "client_name", "service")
    )
    return [s for s in candidatos if agora <= _inicio(s) <= limite]


def gerar_lembretes_barbeiro(barber):
    """Cria um lembrete para cada atendimento do barbeiro que começa nos próximos minutos.

    É chamado quando o barbeiro consulta as notificações (o sistema consulta a cada 30 s),
    o que dispensa um agendador de tarefas no servidor.
    """
    agora = timezone.localtime()
    limite = agora + timedelta(minutes=LEMBRETE_BARBEIRO_MINUTOS)
    for s in _proximos_atendimentos({"barber": barber}, agora, limite):
        if Notification.objects.filter(barber=barber, type="REMINDER", schedule=s).exists():
            continue
        minutos = max(1, round((_inicio(s) - agora).total_seconds() / 60))
        servico = s.service.name if s.service else "Atendimento"
        Notification.objects.create(
            barber=barber, type="REMINDER", schedule=s,
            message=f"Daqui a {minutos} min: {servico} com {s.client_name.name} às {s.start_time.strftime('%H:%M')}.",
        )


def gerar_lembretes_cliente(client):
    """Cria um lembrete para cada atendimento do cliente nas próximas 24 horas."""
    agora = timezone.localtime()
    limite = agora + timedelta(hours=LEMBRETE_CLIENTE_HORAS)
    for s in _proximos_atendimentos({"client_name": client}, agora, limite):
        if ClientNotification.objects.filter(client=client, schedule=s).exists():
            continue
        dia = "hoje" if s.date == agora.date() else "amanhã"
        ClientNotification.objects.create(
            client=client, schedule=s,
            message=f"Lembrete: seu atendimento com {s.barber.name} é {dia} às {s.start_time.strftime('%H:%M')}.",
        )


def avisar_lista_de_espera(schedule):
    """Avisa quem aguarda vaga com o mesmo barbeiro, serviço e data quando um horário é liberado."""
    from schedule.models import WaitlistEntry
    if schedule.service is None or schedule.date < timezone.localdate():
        return
    data = schedule.date.strftime('%d/%m/%Y')
    entries = WaitlistEntry.objects.filter(barber=schedule.barber, service=schedule.service, date=schedule.date,
                                           status="pending").select_related("client")
    for entry in entries:
        notify_client(entry.client, f"Surgiu uma possibilidade de horário com {schedule.barber.name} em {data}. Confira a agenda.")
        notify_barber(schedule.barber, f"A lista de espera tem um cliente interessado em {data}.")
        entry.status = "notified"
        entry.save(update_fields=["status"])


def remover_lembretes(schedule):
    """Apaga os lembretes de um atendimento cancelado, para não avisar de um horário que não existe mais."""
    schedule.lembretes_cliente.all().delete()
    schedule.lembretes_barbeiro.all().delete()


def avisar_estoque_baixo(barber, stock):
    """Avisa o barbeiro quando o produto chega ao estoque mínimo (sem repetir aviso não lido)."""
    if barber is None or stock.quantity > stock.product.estoque_minimo:
        return
    mensagem = f"Estoque baixo: {stock.product.name} está com {stock.quantity} unidade(s)."
    if not Notification.objects.filter(barber=barber, message=mensagem, is_read=False).exists():
        notify_barber(barber, mensagem, "STOCK_LOW")
