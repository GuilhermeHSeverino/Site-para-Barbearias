from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils.timezone import now
from .models import Store
from .serializers import StoreSerializer
from client.models import Client
from stock.models import Stock, StockMovement
from finance.models import Finances
from barber.models import Barber

class StoreListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class StoreRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer


class StoreSaleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        barber_id = request.data.get("barber")
        payment_method = "retirada"
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response({"detail": "Quantidade inválida."}, status=400)

        if not product_id or not barber_id or quantity < 1:
            return Response({"detail": "Produto, barbeiro e quantidade são obrigatórios."}, status=400)

        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"detail": "Apenas clientes podem comprar produtos."}, status=403)

        try:
            barber = Barber.objects.get(id=barber_id)
        except Barber.DoesNotExist:
            return Response({"detail": "Barbeiro não encontrado."}, status=404)

        with transaction.atomic():
            try:
                stock = Stock.objects.select_for_update().select_related("product").get(product_id=product_id)
            except Stock.DoesNotExist:
                return Response({"detail": "Produto não encontrado no estoque."}, status=404)

            if not stock.product.disponivel_na_loja:
                return Response({"detail": "Este produto não está disponível na loja."}, status=400)
            if stock.quantity < quantity:
                return Response({"detail": "Estoque insuficiente para reservar este pedido."}, status=400)
            store_sale = Store.objects.create(stock=stock, client=client, barber=barber, quantity_sold=quantity, status="pendente", payment_method=payment_method)

        return Response({"id": store_sale.id, "status": store_sale.status}, status=201)


class StorePendingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem ver pedidos."}, status=403)
        pedidos = Store.objects.filter(barber=barber, status="pendente").select_related("stock__product", "client").order_by("date_of_sale", "id")
        return Response([{
            "id": pedido.id,
            "product": pedido.stock.product.name,
            "quantity": pedido.quantity_sold,
            "client": pedido.client.name,
            "created_at": pedido.date_of_sale,
            "payment_method": pedido.payment_method,
            "total": float(pedido.stock.product.price * pedido.quantity_sold),
        } for pedido in pedidos])


class StoreClientOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem ver pedidos."}, status=403)
        pedidos = Store.objects.filter(client=client).select_related("stock__product", "barber").order_by("-date_of_sale", "-id")
        return Response([{
            "id": pedido.id,
            "product": pedido.stock.product.name,
            "quantity": pedido.quantity_sold,
            "barber": pedido.barber.name if pedido.barber else "Barbeiro não informado",
            "status": pedido.status,
            "payment_method": pedido.payment_method,
            "total": float(pedido.stock.product.price * pedido.quantity_sold),
            "created_at": pedido.date_of_sale,
        } for pedido in pedidos])


class StoreCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        client = Client.objects.filter(user=request.user).first()
        if not client:
            return Response({"detail": "Apenas clientes podem cancelar pedidos."}, status=403)
        try:
            pedido = Store.objects.get(id=pk, client=client)
        except Store.DoesNotExist:
            return Response({"detail": "Pedido não encontrado."}, status=404)
        if pedido.status != "pendente":
            return Response({"detail": "Somente pedidos pendentes podem ser cancelados."}, status=400)
        pedido.status = "cancelado"
        pedido.save(update_fields=["status"])
        return Response({"id": pedido.id, "status": pedido.status})


class StoreConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        barber = Barber.objects.filter(user=request.user).first()
        if not barber:
            return Response({"detail": "Apenas barbeiros podem confirmar entregas."}, status=403)

        with transaction.atomic():
            try:
                pedido = Store.objects.select_for_update().select_related("stock__product").get(id=pk, barber=barber)
            except Store.DoesNotExist:
                return Response({"detail": "Pedido não encontrado."}, status=404)
            if pedido.status != "pendente":
                return Response({"detail": "Este pedido já foi processado."}, status=400)
            if pedido.stock.quantity < pedido.quantity_sold:
                return Response({"detail": "Estoque insuficiente para confirmar a entrega."}, status=400)

            StockMovement.objects.create(product=pedido.stock.product, type="saida", quantity=pedido.quantity_sold, description="Entrega de pedido da loja")
            Finances.objects.create(store=pedido, barber=barber, tipo="entrada", valor=pedido.stock.product.price * pedido.quantity_sold, date=now().date(), payment_method="dinheiro", categoria="outros")
            pedido.status = "entregue"
            pedido.save(update_fields=["status"])

        return Response({"id": pedido.id, "status": pedido.status})
