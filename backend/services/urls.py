from django.urls import path
from .views import ServicesCreateListView, ServicesRetrieveUpdateDestroyView

urlpatterns = [
    path('services/', ServicesCreateListView.as_view(), name='services-list-create'),
    path('services/<int:pk>/', ServicesRetrieveUpdateDestroyView.as_view(), name='services-retrieve-update-destroy'),
]
