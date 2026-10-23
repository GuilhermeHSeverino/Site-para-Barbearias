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

    def validate(self, attrs):
        def valor(campo):
            return attrs.get(campo, getattr(self.instance, campo, None))

        inicio, fim = valor('work_start'), valor('work_end')
        if inicio and fim and inicio >= fim:
            raise serializers.ValidationError({"work_end": "O fim do expediente deve ser depois do início."})

        pausa_inicio, pausa_fim = valor('break_start'), valor('break_end')
        if pausa_inicio and pausa_fim:
            if pausa_inicio >= pausa_fim:
                raise serializers.ValidationError({"break_end": "O fim do intervalo deve ser depois do início."})
            if inicio and fim and (pausa_inicio < inicio or pausa_fim > fim):
                raise serializers.ValidationError({"break_start": "O intervalo precisa estar dentro do expediente."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data['email']

        # usuário comum: o perfil de barbeiro já dá acesso às telas da barbearia,
        # sem os poderes de administrador do sistema
        user = User.objects.create_user(
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
