from rest_framework import serializers
from .models import Client, BarberClientNote
from django.contrib.auth.models import User

class ClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True) 
    is_superuser = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'password','is_superuser','created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 

    def get_is_superuser(self, obj):
        return obj.user.is_superuser

    def validate_email(self, value):
        # o e-mail também é o nome de usuário do login, então não pode repetir em nenhuma conta
        outros = Client.objects.filter(email__iexact=value)
        if self.instance:
            outros = outros.exclude(pk=self.instance.pk)
        usuario_existente = User.objects.filter(username__iexact=value) | User.objects.filter(email__iexact=value)
        if self.instance:
            usuario_existente = usuario_existente.exclude(pk=self.instance.user_id)
        if outros.exists() or usuario_existente.exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value
    
    def create(self, validated_data):
        # o login usa o e-mail como nome de usuário
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=password
        )

        client = Client.objects.create(
            user=user,
            name=validated_data['name'],
            email=validated_data['email'],
            phone=validated_data['phone']
        )

        return client

class BarberClientNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarberClientNote
        fields = ['id', 'barber', 'client', 'note', 'created_at', 'updated_at']
        read_only_fields = ['barber', 'created_at', 'updated_at']
