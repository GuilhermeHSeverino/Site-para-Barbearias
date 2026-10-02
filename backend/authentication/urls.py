from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView,TokenVerifyView
from .views import MyTokenObtainPairView, ClientRegisterView

urlpatterns = [
    path('authentication/token/',MyTokenObtainPairView.as_view(), name='token_obtain_par'),
    path('authentication/token/refresh/',TokenRefreshView.as_view(), name='token_refresh'),
    path('authentication/token/verify/',TokenVerifyView.as_view(), name='token_verify'),
    path('authentication/register/', ClientRegisterView.as_view(), name='client-register'),

]
