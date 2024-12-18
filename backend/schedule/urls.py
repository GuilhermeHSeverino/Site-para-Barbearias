from django.urls import path
from .views import ScheduleCreateListView, ScheduleRetrieveUpdateDestroyView

urlpatterns = [
    path('schedule/', ScheduleCreateListView.as_view(), name='schedule-list-create'),
    path('schedule/<int:pk>/', ScheduleRetrieveUpdateDestroyView.as_view(), name='schedule-retrieve-update-destroy'),
]
