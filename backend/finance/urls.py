from django.urls import path
from .views import (
    FinancesListCreateView,
    FinancesRetrieveUpdateDestroyView,
    FinanceReportAPIView,
    FinanceSaldoAPIView,
    FinanceSummaryAPIView,
)

urlpatterns = [
    path('finance/', FinancesListCreateView.as_view(), name='finance-list-create'),
    path('finance/<int:pk>/', FinancesRetrieveUpdateDestroyView.as_view(), name='finance-retrieve-update-destroy'),
    path('finance-report/<int:year>/<int:month>/', FinanceReportAPIView.as_view(), name='finance-report'),
    path('finance-saldo/', FinanceSaldoAPIView.as_view(), name='finance-saldo'),
    path('finance-summary/', FinanceSummaryAPIView.as_view(), name='finance-summary'),
]
