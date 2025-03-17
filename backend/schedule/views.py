from rest_framework import generics
from .models import Schedule
from .serializers import ScheduleSerializer
from rest_framework.permissions import IsAuthenticated

class ScheduleCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

class ScheduleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
