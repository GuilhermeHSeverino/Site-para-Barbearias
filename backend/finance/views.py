from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum
from django.utils.timezone import now
from datetime import timedelta
from .models import Finances
from .serializers import FinancesSerializer


# 🔥 FILTRO DE PERÍODO
def filtrar_periodo(queryset, periodo):
    today = now().date()

    if periodo == 'diario':
        return queryset.filter(date=today)

    elif periodo == 'semanal':
        start_week = today - timedelta(days=today.weekday())
        return queryset.filter(date__gte=start_week, date__lte=today)

    elif periodo == 'mensal':
        return queryset.filter(date__month=today.month, date__year=today.year)

    elif periodo == 'anual':
        return queryset.filter(date__year=today.year)

    return queryset


# 🔥 LISTAR / CRIAR
class FinancesListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = FinancesSerializer

    def get_queryset(self):
        queryset = Finances.objects.all().order_by('date')
        periodo = self.request.query_params.get('periodo', 'mensal')
        return filtrar_periodo(queryset, periodo)


# 🔥 CRUD
class FinancesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Finances.objects.all()
    serializer_class = FinancesSerializer


# 🔥 RELATÓRIO (CORRIGIDO)
class FinanceReportAPIView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request, year, month):
        entradas = Finances.objects.filter(
            date__year=year,
            date__month=month,
            tipo='entrada'
        ).aggregate(total=Sum('valor'))['total'] or 0

        saidas = Finances.objects.filter(
            date__year=year,
            date__month=month,
            tipo='saida'
        ).aggregate(total=Sum('valor'))['total'] or 0

        return Response({
            "year": year,
            "month": month,
            "total_entradas": float(entradas),
            "total_saidas": float(saidas),
            "lucro_liquido": float(entradas - saidas)
        })

class FinanceSummaryAPIView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        periodo = request.query_params.get('periodo', 'mensal')
        queryset = filtrar_periodo(Finances.objects.all(), periodo)

        entradas = queryset.filter(tipo='entrada').aggregate(total=Sum('valor'))['total'] or 0
        saidas = queryset.filter(tipo='saida').aggregate(total=Sum('valor'))['total'] or 0

        return Response({
            "periodo": periodo,
            "total_entradas": float(entradas),
            "total_saidas": float(saidas),
            "lucro_liquido": float(entradas - saidas)
        })


# 🔥 SALDO ACUMULADO (PERFEITO PRO FRONT)
class FinanceSaldoAPIView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        periodo = request.query_params.get('periodo', 'mensal')

        queryset = filtrar_periodo(
            Finances.objects.all().order_by('date'),
            periodo
        )

        saldo = 0
        data = []

        for f in queryset:
            # 🔥 ENTRADA / SAÍDA
            if f.tipo == "entrada":
                saldo += f.valor
            else:
                saldo -= f.valor

            # 🔥 DESCRIÇÃO DINÂMICA (PROFISSIONAL)
            descricao = ""

            if f.schedule and f.schedule.service:
                descricao = f.schedule.service.name

            elif f.store:
                descricao = "Venda de produto"

            else:
                descricao = "Outro"

            data.append({
                "id": f.id,
                "date": f.date,
                "descricao": descricao,
                "tipo": f.tipo,
                "valor": float(f.valor),
                "saldo_acumulado": float(saldo)
            })

        return Response(data)