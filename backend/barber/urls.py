from django.urls import path
from .views import BarberCreateListView, BarberRetrieveUpdateDestroyView, BarberProfileUpdateView

urlpatterns = [
    path('barber/', BarberCreateListView.as_view(), name='barber-list-create'),
    path('barber/<int:pk>/', BarberRetrieveUpdateDestroyView.as_view(), name='barber-retrieve-update-destroy'),
    path('profile/update/', BarberProfileUpdateView.as_view(), name='barber-profile-update'),
]
