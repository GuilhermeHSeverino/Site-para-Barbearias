from datetime import timedelta
import re
from rest_framework import serializers
from .models import Services

class ServicesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Services
        fields = "__all__"
        read_only_fields = ['barber']

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("O preço não pode ser negativo.")
        return value

    def validate_duration(self, value):
        # a tela envia a duração como texto "HH:MM:SS"
        if isinstance(value, str):
            time_format = re.compile(r'^\d{2}:\d{2}:\d{2}$')
            if not time_format.match(value):
                raise serializers.ValidationError("A duração deve estar no formato HH:MM:SS.")

            try:
                hours, minutes, seconds = map(int, value.split(':'))
                value = timedelta(hours=hours, minutes=minutes, seconds=seconds)
            except ValueError:
                raise serializers.ValidationError("A duração deve ser válida.")

        if value < timedelta(minutes=15):
            raise serializers.ValidationError("A duração deve ser de no mínimo 15 minutos.")
        return value