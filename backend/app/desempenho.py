"""Medição do tempo de resposta da API (RNF01: respostas em menos de 500 ms).

Executar com:  python manage.py test app.desempenho

O teste cria um banco temporário com volume de dados equivalente a alguns meses de uso
de uma barbearia, chama cada rota várias vezes e informa a média, o percentil 95 e o
tempo máximo. Mede o processamento no servidor (sem a latência da rede).
"""
import statistics
import time

from rest_framework.test import APITestCase

from app.factories import HORAS_ATENDIMENTO, data_futura, popular_base
from finance.models import Finances
from reviews.models import Review

REPETICOES = 30
LIMITE_MS = 500


class DesempenhoAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        base = popular_base()
        cls.barbeiros, cls.clientes, cls.servicos = base["barbeiros"], base["clientes"], base["servicos"]
        cls.barbeiro = cls.barbeiros[0]
        cls.total_agendamentos = base["total_agendamentos"]

    def medir(self, usuario, metodo, url, dados=None):
        self.client.force_authenticate(usuario)
        tempos = []
        for _ in range(REPETICOES):
            inicio = time.perf_counter()
            resposta = getattr(self.client, metodo)(url, dados, format="json")
            tempos.append((time.perf_counter() - inicio) * 1000)
            self.assertLess(resposta.status_code, 400, f"{url}: {resposta.status_code} {getattr(resposta, 'data', '')}")
        tempos.sort()
        return statistics.mean(tempos), tempos[int(len(tempos) * 0.95) - 1], tempos[-1]

    def test_tempo_de_resposta_das_rotas_principais(self):
        cliente = self.clientes[0]
        servico = self.servicos[0]
        dia_livre = data_futura(40).isoformat()
        rotas = [
            ("Consulta de horários livres", cliente.user, "get", "/api/v1/schedule/availability/",
             {"barber_id": self.barbeiro.id, "service_id": servico.id, "date": data_futura(5).isoformat()}),
            ("Agenda do barbeiro", self.barbeiro.user, "get", "/api/v1/schedule/", None),
            ("Histórico do cliente", cliente.user, "get", "/api/v1/schedule/", None),
            ("Painel financeiro (mensal)", self.barbeiro.user, "get", "/api/v1/finance/", {"periodo": "mensal"}),
            ("Saldo acumulado (mensal)", self.barbeiro.user, "get", "/api/v1/finance-saldo/", {"periodo": "mensal"}),
            ("Avaliações", self.barbeiro.user, "get", "/api/v1/reviews/", None),
            ("Estoque", self.barbeiro.user, "get", "/api/v1/stock/", None),
            ("Pedidos pendentes da loja", self.barbeiro.user, "get", "/api/v1/stores/pending/", None),
            ("Catálogo de serviços", cliente.user, "get", "/api/v1/services/", None),
        ]
        resultados = [(nome, *self.medir(u, m, url, dados)) for nome, u, m, url, dados in rotas]

        # criação de agendamento: cada repetição usa um horário diferente para não gerar conflito
        self.client.force_authenticate(cliente.user)
        tempos = []
        for i in range(REPETICOES):
            corpo = {"date": dia_livre, "start_time": f"{HORAS_ATENDIMENTO[i // 3]:02d}:{(i % 3) * 10:02d}",
                     "barber": self.barbeiros[i % 3].id, "service": self.servicos[(i % 3) * 4].id}
            inicio = time.perf_counter()
            resposta = self.client.post("/api/v1/schedule/", corpo, format="json")
            tempos.append((time.perf_counter() - inicio) * 1000)
            self.assertEqual(resposta.status_code, 201, resposta.data)
        tempos.sort()
        resultados.append(("Criação de agendamento", statistics.mean(tempos), tempos[int(len(tempos) * 0.95) - 1], tempos[-1]))

        print(f"\nBase de teste: {self.total_agendamentos} agendamentos, {Finances.objects.count()} lançamentos, "
              f"{Review.objects.count()} avaliações; {REPETICOES} repetições por rota")
        print(f"{'Rota':32} {'média':>9} {'p95':>9} {'máximo':>9}")
        for nome, media, p95, maximo in resultados:
            print(f"{nome:32} {media:7.1f}ms {p95:7.1f}ms {maximo:7.1f}ms")

        for nome, media, p95, maximo in resultados:
            self.assertLess(p95, LIMITE_MS, f"{nome} excedeu {LIMITE_MS} ms (p95 = {p95:.1f} ms)")
