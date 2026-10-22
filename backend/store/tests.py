from rest_framework.test import APITestCase

from app.factories import criar_barbeiro, criar_cliente, criar_produto
from finance.models import Finances
from stock.models import Stock, StockMovement
from .models import Store


class LojaTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.cliente = criar_cliente()
        self.produto = criar_produto(preco="30.00", quantidade=3)

    def reservar(self, cliente, quantidade):
        self.client.force_authenticate(cliente.user)
        return self.client.post("/api/v1/stores/sale/", {
            "product": self.produto.id, "barber": self.barbeiro.id, "quantity": quantidade,
        })

    def confirmar(self, pedido, **dados):
        self.client.force_authenticate(self.barbeiro.user)
        return self.client.patch(f"/api/v1/stores/{pedido.id}/confirm/", dados)

    def estoque(self):
        return Stock.objects.get(product=self.produto).quantity

    def test_reserva_nao_baixa_estoque(self):
        self.assertEqual(self.reservar(self.cliente, 2).status_code, 201)
        self.assertEqual(self.estoque(), 3)
        self.assertEqual(Store.objects.get().status, "pendente")

    def test_reservas_pendentes_reduzem_quantidade_disponivel(self):
        self.reservar(self.cliente, 2)
        resposta = self.reservar(criar_cliente("Bruno"), 2)  # só resta 1 unidade livre
        self.assertEqual(resposta.status_code, 400)
        self.assertEqual(Store.objects.count(), 1)

    def test_confirmacao_baixa_estoque_e_lanca_receita(self):
        self.reservar(self.cliente, 2)
        pedido = Store.objects.get()

        resposta = self.confirmar(pedido, payment_method="cartao_debito")

        self.assertEqual(resposta.status_code, 200)
        pedido.refresh_from_db()
        self.assertEqual(pedido.status, "entregue")
        self.assertEqual(self.estoque(), 1)
        self.assertTrue(StockMovement.objects.filter(product=self.produto, type="saida", quantity=2).exists())
        receita = Finances.objects.get(store=pedido)
        self.assertEqual(str(receita.valor), "60.00")
        self.assertEqual(receita.payment_method, "cartao_debito")

        # o barbeiro (sem ser administrador) vê o lançamento no painel financeiro; o cliente não
        self.client.force_authenticate(self.barbeiro.user)
        painel = self.client.get("/api/v1/finance/", {"periodo": "diario"})
        self.assertEqual(painel.status_code, 200)
        self.assertEqual(len(painel.data), 1)
        self.client.force_authenticate(self.cliente.user)
        self.assertEqual(self.client.get("/api/v1/finance/").status_code, 403)

    def test_recusa_forma_de_pagamento_invalida(self):
        self.reservar(self.cliente, 1)
        pedido = Store.objects.get()
        self.assertEqual(self.confirmar(pedido, payment_method="cheque").status_code, 400)
        self.assertEqual(self.estoque(), 3)

    def test_pedido_nao_pode_ser_confirmado_duas_vezes(self):
        self.reservar(self.cliente, 1)
        pedido = Store.objects.get()
        self.confirmar(pedido, payment_method="pix")
        self.assertEqual(self.confirmar(pedido, payment_method="pix").status_code, 400)
        self.assertEqual(self.estoque(), 2)
