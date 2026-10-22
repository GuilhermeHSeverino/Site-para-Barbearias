from rest_framework.test import APITestCase

from app.factories import criar_barbeiro, criar_cliente, criar_produto
from finance.models import Finances
from .models import Stock, StockMovement


class CompraDeProdutosTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.client.force_authenticate(self.barbeiro.user)

    def test_cadastro_com_custo_lanca_saida_no_financeiro(self):
        resposta = self.client.post("/api/v1/products/", {
            "name": "Navalha", "description": "Navalha profissional", "price": "150.00",
            "initial_quantity": 1, "custo_total": "100.00",
        })
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(Stock.objects.get(product__name="Navalha").quantity, 1)
        self.assertTrue(StockMovement.objects.filter(product__name="Navalha", type="entrada", quantity=1).exists())

        saida = Finances.objects.get()
        self.assertEqual((saida.tipo, str(saida.valor), saida.categoria), ("saida", "100.00", "produtos"))
        self.assertIn("Navalha", saida.descricao)
        resumo = self.client.get("/api/v1/finance-summary/", {"periodo": "diario"}).data
        self.assertEqual(resumo["total_saidas"], 100.0)

    def test_entrada_de_estoque_com_custo_e_recusa_custo_em_saida(self):
        produto = criar_produto("Pomada", quantidade=2)
        entrada = self.client.post("/api/v1/stock-movements/", {
            "product": produto.id, "type": "entrada", "quantity": 3, "custo_total": "45.00",
        })
        self.assertEqual(entrada.status_code, 201)
        self.assertEqual(Stock.objects.get(product=produto).quantity, 5)
        self.assertEqual(str(Finances.objects.get(tipo="saida").valor), "45.00")

        saida = self.client.post("/api/v1/stock-movements/", {
            "product": produto.id, "type": "saida", "quantity": 1, "custo_total": "10.00",
        })
        self.assertEqual(saida.status_code, 400)
        self.assertEqual(Finances.objects.count(), 1)

    def test_cliente_nao_cadastra_produto(self):
        self.client.force_authenticate(criar_cliente().user)
        resposta = self.client.post("/api/v1/products/", {"name": "X", "description": "Y", "price": "10.00"})
        self.assertEqual(resposta.status_code, 403)
