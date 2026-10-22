from django.urls import path
from .views import NotificationListView, MarkNotificationReadView, ClientNotificationListView, ClientNotificationReadView, ClientNotificationReadAllView

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', MarkNotificationReadView.as_view(), name='notification-read'),
    path('client-notifications/', ClientNotificationListView.as_view(), name='client-notifications'),
    path('client-notifications/read-all/', ClientNotificationReadAllView.as_view(), name='client-notifications-read-all'),
    path('client-notifications/<int:pk>/', ClientNotificationReadView.as_view(), name='client-notification-read'),
]
