from django.urls import path
from .views import FinancesListCreateView, FinancesRetrieveUpdateDestroyView,FinanceReportAPIView

urlpatterns = [
    path('finance/', FinancesListCreateView.as_view(), name='finance-list-create'),
    path('finance/<int:pk>/', FinancesRetrieveUpdateDestroyView.as_view(), name='finance-retrieve-update-destroy'),
    path('finance-report/<int:year>/<int:month>/', FinanceReportAPIView.as_view(), name='finance-report'),

]