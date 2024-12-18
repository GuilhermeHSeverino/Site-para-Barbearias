from django.urls import path
from .views import StoreListCreateView,StoreRetrieveUpdateDestroyView

urlpatterns = [
    path('stores/', StoreListCreateView.as_view(), name='store_list_create'),
    path('stores/<int:pk>/', StoreRetrieveUpdateDestroyView.as_view(), name='store_retrieve_update_destroy'),
]
