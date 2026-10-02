from django.urls import path
from .views import ScheduleCreateListView, ScheduleRetrieveUpdateDestroyView, ScheduleClientCancelView, ScheduleAvailabilityView, VacationCreateView, WaitlistCreateView, WaitlistListView

urlpatterns = [
    path('schedule/', ScheduleCreateListView.as_view(), name='schedule-list-create'),
    path('schedule/availability/', ScheduleAvailabilityView.as_view(), name='schedule-availability'),
    path('schedule/vacations/', VacationCreateView.as_view(), name='schedule-vacation-create'),
    path('schedule/<int:pk>/cancel/', ScheduleClientCancelView.as_view(), name='schedule-client-cancel'),
    path('schedule/waitlist/', WaitlistCreateView.as_view(), name='waitlist-create'),
    path('schedule/waitlist/pending/', WaitlistListView.as_view(), name='waitlist-pending'),
    path('schedule/<int:pk>/', ScheduleRetrieveUpdateDestroyView.as_view(), name='schedule-retrieve-update-destroy'),
]
