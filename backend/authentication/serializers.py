from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from barber.models import Barber

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login = attrs.get(self.username_field)
        user = User.objects.filter(email__iexact=login).first()
        if user:
            attrs[self.username_field] = user.username
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['is_barber'] = hasattr(user, 'barber')
        token['email'] = user.email
        token['username'] = user.username
        token['barber_id'] = user.barber.id if hasattr(user, 'barber') else None

        return token