from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Sum

from .models import Finances
from .serializers import FinancesSerializer


class FinancesListCreateView(generics.ListCreateAPIView):
    queryset = Finances.objects.all()
    serializer_class = FinancesSerializer

class FinancesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Finances.objects.all()
    serializer_class = FinancesSerializer


class FinanceReportAPIView(generics.GenericAPIView):
    serializer_class = FinancesSerializer

    def get(self, request, year, month):
        # Filtra as finanças pelo ano e mês
        faturamento = Finances.objects.filter(
            date__year=year,  # Filtra pelo ano
            date__month=month  # Filtra pelo mês
        ).aggregate(total_faturado=Sum('total'))  # Soma o campo total

        # Retorna a resposta em JSON
        return Response({
            "year": year,
            "month": month,
            "total_faturado": faturamento['total_faturado'] or 0
        })
