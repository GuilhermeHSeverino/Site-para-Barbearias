# backend/accounts/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, serializers
from django.contrib.auth.models import User
from client.models import Client
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class ClientRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = str(request.data.get("name", "")).strip()
        email = str(request.data.get("email", "")).strip().lower()
        phone = str(request.data.get("phone", "")).strip()
        password = request.data.get("password", "")
        if not all([name, email, phone, password]):
            return Response({"detail": "Preencha todos os campos."}, status=400)
        try:
            validate_email(email)
        except ValidationError:
            return Response({"detail": "Informe um e-mail válido, como nome@email.com."}, status=400)
        if len("".join(c for c in phone if c.isdigit())) < 10:
            return Response({"detail": "Informe o telefone com DDD, por exemplo (12) 99999-9999."}, status=400)
        if len(password) < 6:
            return Response({"detail": "A senha deve ter pelo menos 6 caracteres."}, status=400)
        if User.objects.filter(username=email).exists() or Client.objects.filter(email=email).exists():
            return Response({"detail": "Este e-mail já está cadastrado."}, status=400)
        user = User.objects.create_user(username=email, email=email, password=password)
        Client.objects.create(user=user, name=name, email=email, phone=phone)
        return Response({"detail": "Cadastro realizado com sucesso."}, status=status.HTTP_201_CREATED)
