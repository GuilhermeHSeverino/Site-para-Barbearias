from .models import ClientNotification, Notification


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
