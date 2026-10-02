from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from barber.models import Barber

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['is_barber'] = hasattr(user, 'barber')
        token['email'] = user.email
        token['username'] = user.username
        token['barber_id'] = user.barber.id if hasattr(user, 'barber') else None

        return token