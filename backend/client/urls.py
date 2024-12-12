from django.urls import path
from .views import ClientCreateListView, ClientRetrieveUpdateDestroyView

urlpatterns = [
    path('client/', ClientCreateListView.as_view(), name='client-list-create'),
    path('client/<int:pk>/', ClientRetrieveUpdateDestroyView.as_view(), name='client-retrieve-update-destroy'),
]
