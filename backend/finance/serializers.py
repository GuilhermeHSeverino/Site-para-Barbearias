from rest_framework import serializers
from .models import Finances

class FinancesSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="schedule.service.name", read_only=True)
    barber_name = serializers.CharField(source="barber.name", read_only=True)

    class Meta:
        model = Finances
        fields = "__all__"