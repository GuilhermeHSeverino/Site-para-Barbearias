# serializers.py
from rest_framework import serializers
from .models import Barber
from django.contrib.auth.models import User

class BarberSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_superuser = serializers.SerializerMethodField()
    barber_id = serializers.SerializerMethodField()  # Retorna ID do barber

    class Meta:
        model = Barber
        fields = [
            'barber_id', 'id', 'name', 'email', 'phone', 'password',
            'is_superuser', 'created_at', 'updated_at',
            'photo', 'bio', 'specialties', 'work_start', 'work_end', 'break_start', 'break_end'
        ]
        read_only_fields = ['created_at', 'updated_at', 'barber_id']

    def get_is_superuser(self, obj):
        return obj.user.is_superuser

    def get_barber_id(self, obj):
        return obj.id

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data['email']

        # Criar usuário como superuser
        user = User.objects.create_superuser(
            username=email,
            email=email,
            password=password
        )

        # Criar o barber associado
        barber = Barber.objects.create(
            user=user,
            name=validated_data['name'],
            email=email,
            phone=validated_data['phone']
        )

        return barber
