from django.urls import path
from .views import StockCreateListView, StockRetrieveUpdateDestroyView

urlpatterns = [
    path('stock/', StockCreateListView.as_view(), name='stock-list-create'),
    path('stock/<int:pk>/', StockRetrieveUpdateDestroyView.as_view(), name='stock-retrieve-update-destroy'),
]
