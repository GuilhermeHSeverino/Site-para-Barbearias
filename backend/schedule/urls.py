from django.urls import path
from .views import ScheduleCreateListView, ScheduleRetrieveUpdateDestroyView, ScheduleClientCancelView, ScheduleAvailabilityView, VacationListCreateView, VacationDeleteView, WaitlistCreateView, WaitlistListView

urlpatterns = [
    path('schedule/', ScheduleCreateListView.as_view(), name='schedule-list-create'),
    path('schedule/availability/', ScheduleAvailabilityView.as_view(), name='schedule-availability'),
    path('schedule/vacations/', VacationListCreateView.as_view(), name='schedule-vacation-list-create'),
    path('schedule/vacations/<int:pk>/', VacationDeleteView.as_view(), name='schedule-vacation-delete'),
    path('schedule/<int:pk>/cancel/', ScheduleClientCancelView.as_view(), name='schedule-client-cancel'),
    path('schedule/waitlist/', WaitlistCreateView.as_view(), name='waitlist-create'),
    path('schedule/waitlist/pending/', WaitlistListView.as_view(), name='waitlist-pending'),
    path('schedule/<int:pk>/', ScheduleRetrieveUpdateDestroyView.as_view(), name='schedule-retrieve-update-destroy'),
]
