from rest_framework import serializers
from .models import Client
from django.contrib.auth.models import User

class ClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True) 
    is_superuser = serializers.SerializerMethodField()  # Campo adicional para verificar superusuário

    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'password','is_superuser','created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 

    def get_is_superuser(self, obj):
        return obj.user.is_superuser
    
    def create(self, validated_data):
        # Criação do User com a senha fornecida
        password = validated_data.pop('password')  # Remover a senha dos dados validados
        user = User.objects.create_user(
            username=validated_data['email'],  # Usar o email como username
            email=validated_data['email'],
            password=password
        )
        
        # Criar o Client e associá-lo ao User
        client = Client.objects.create(
            user=user,
            name=validated_data['name'],
            email=validated_data['email'],
            phone=validated_data['phone']
        )
        
        return client