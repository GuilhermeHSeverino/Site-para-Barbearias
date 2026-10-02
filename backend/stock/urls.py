from django.urls import path
from .views import StockCreateListView, StockRetrieveUpdateDestroyView, StockMovementView, StockAlertView

urlpatterns = [
    path('stock/', StockCreateListView.as_view(), name='stock-list-create'),
    path('stock/<int:pk>/', StockRetrieveUpdateDestroyView.as_view(), name='stock-retrieve-update-destroy'),
    path("stock-movements/", StockMovementView.as_view()),
    path('stock-alerts/', StockAlertView.as_view(), name='stock-alerts'),
]
