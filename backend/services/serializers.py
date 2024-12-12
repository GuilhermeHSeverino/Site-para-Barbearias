from datetime import timedelta
import re
from rest_framework import serializers
from .models import Services

class ServicesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Services
        fields = "__all__"

    def validate_duration(self, value):
        # Verifica se o valor é uma string no formato "HH:MM:SS"
        if isinstance(value, str):
            # Expressão regular para validar o formato HH:MM:SS
            time_format = re.compile(r'^\d{2}:\d{2}:\d{2}$')
            if not time_format.match(value):
                raise serializers.ValidationError("A duração deve estar no formato HH:MM:SS.")
            
            # Converte a string para um timedelta
            try:
                hours, minutes, seconds = map(int, value.split(':'))
                value = timedelta(hours=hours, minutes=minutes, seconds=seconds)
            except ValueError:
                raise serializers.ValidationError("A duração deve ser válida.")

        # Definir o valor mínimo como 15 minutos
        min_duration = timedelta(minutes=15)
        if value < min_duration:
            raise serializers.ValidationError("A duração deve ser de no mínimo 15 minutos. formato HH:MM:SS")
        
        return value