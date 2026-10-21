from datetime import time

from rest_framework.test import APITestCase

from app.factories import criar_barbeiro, criar_cliente, criar_servico, data_futura
from finance.models import Finances
from notifications.models import ClientNotification
from .models import Schedule, Vacation, WaitlistEntry


class DisponibilidadeTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()  # jornada 08h-12h, intervalo 10h-11h
        self.cliente = criar_cliente()
        self.servico = criar_servico(self.barbeiro, minutos=30)
        self.data = data_futura()
        self.client.force_authenticate(self.cliente.user)

    def consultar(self):
        return self.client.get("/api/v1/schedule/availability/", {
            "barber_id": self.barbeiro.id, "service_id": self.servico.id, "date": self.data.isoformat(),
        })

    def horarios(self):
        return [slot["time"] for slot in self.consultar().data["slots"]]

    def test_respeita_jornada_e_intervalo(self):
        self.assertEqual(self.horarios(), ["08:00", "08:30", "09:00", "09:30", "11:00", "11:30"])

    def test_remove_horarios_ocupados_com_folga_entre_atendimentos(self):
        Schedule.objects.create(date=self.data, start_time=time(9, 0), barber=self.barbeiro,
                                client_name=self.cliente, service=self.servico)
        horarios = self.horarios()
        self.assertIn("08:30", horarios)
        self.assertNotIn("09:00", horarios)
        # 09:30 cai dentro da folga mínima após o atendimento das 09:00
        self.assertNotIn("09:30", horarios)

    def test_agendamento_cancelado_libera_horario(self):
        Schedule.objects.create(date=self.data, start_time=time(9, 0), barber=self.barbeiro,
                                client_name=self.cliente, service=self.servico, status="cancelado")
        self.assertIn("09:00", self.horarios())

    def test_ferias_retorna_lista_vazia(self):
        Vacation.objects.create(barber=self.barbeiro, start_date=self.data, end_date=self.data)
        resposta = self.consultar()
        self.assertEqual(resposta.data["slots"], [])
        self.assertTrue(resposta.data["vacation"])


class AgendamentoTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.cliente = criar_cliente()
        self.servico = criar_servico(self.barbeiro, preco="45.00")
        self.data = data_futura()

    def agendar(self, cliente, inicio="09:00"):
        self.client.force_authenticate(cliente.user)
        return self.client.post("/api/v1/schedule/", {
            "date": self.data.isoformat(), "start_time": inicio,
            "barber": self.barbeiro.id, "service": self.servico.id,
        })

    def test_cliente_agenda_horario_livre(self):
        resposta = self.agendar(self.cliente)
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(Schedule.objects.get().client_name, self.cliente)

    def test_recusa_horario_em_conflito(self):
        self.agendar(self.cliente)
        resposta = self.agendar(criar_cliente("Bruno"))
        self.assertEqual(resposta.status_code, 400)
        self.assertEqual(Schedule.objects.count(), 1)

    def test_recusa_agendamento_durante_ferias(self):
        Vacation.objects.create(barber=self.barbeiro, start_date=self.data, end_date=self.data)
        self.assertEqual(self.agendar(self.cliente).status_code, 400)

    def test_cancelamento_notifica_lista_de_espera(self):
        agendamento = Schedule.objects.create(date=self.data, start_time=time(9, 0), barber=self.barbeiro,
                                              client_name=self.cliente, service=self.servico)
        interessado = criar_cliente("Bruno")
        espera = WaitlistEntry.objects.create(client=interessado, barber=self.barbeiro, service=self.servico, date=self.data)

        self.client.force_authenticate(self.cliente.user)
        resposta = self.client.patch(f"/api/v1/schedule/{agendamento.id}/cancel/")

        self.assertEqual(resposta.status_code, 200)
        agendamento.refresh_from_db(); espera.refresh_from_db()
        self.assertEqual(agendamento.status, "cancelado")
        self.assertEqual(espera.status, "notified")
        self.assertTrue(ClientNotification.objects.filter(client=interessado).exists())

    def test_lista_filtrada_por_periodo(self):
        for dias in (1, 5, 20):
            Schedule.objects.create(date=data_futura(dias), start_time=time(9, 0), barber=self.barbeiro,
                                    client_name=self.cliente, service=self.servico)
        self.client.force_authenticate(self.barbeiro.user)
        resposta = self.client.get("/api/v1/schedule/", {"data_inicio": data_futura(0).isoformat(), "data_fim": data_futura(6).isoformat()})
        self.assertEqual(len(resposta.data), 2)
        self.assertEqual(self.client.get("/api/v1/schedule/", {"data_inicio": "21/10/2026"}).status_code, 400)

    def test_conclusao_gera_receita_uma_unica_vez(self):
        agendamento = Schedule.objects.create(date=self.data, start_time=time(9, 0), barber=self.barbeiro,
                                              client_name=self.cliente, service=self.servico)
        self.client.force_authenticate(self.barbeiro.user)
        url = f"/api/v1/schedule/{agendamento.id}/"

        self.assertEqual(self.client.patch(url, {"status": "concluido", "payment_method": "pix"}).status_code, 200)
        self.client.patch(url, {"status": "concluido", "payment_method": "pix"})

        receita = Finances.objects.get(schedule=agendamento)
        self.assertEqual(str(receita.valor), "45.00")
        self.assertEqual(receita.payment_method, "pix")


class FolgasTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.client.force_authenticate(self.barbeiro.user)
        self.url = "/api/v1/schedule/vacations/"

    def test_bloqueia_um_unico_dia(self):
        dia = data_futura(3)
        resposta = self.client.post(self.url, {"start_date": dia.isoformat(), "end_date": dia.isoformat()})
        self.assertEqual(resposta.status_code, 201)
        folga = Vacation.objects.get()
        self.assertEqual((folga.start_date, folga.end_date), (dia, dia))

    def test_recusa_periodo_invertido_ou_sobreposto(self):
        inicio, fim = data_futura(3), data_futura(5)
        self.assertEqual(self.client.post(self.url, {"start_date": fim.isoformat(), "end_date": inicio.isoformat()}).status_code, 400)
        self.client.post(self.url, {"start_date": inicio.isoformat(), "end_date": fim.isoformat()})
        self.assertEqual(self.client.post(self.url, {"start_date": fim.isoformat(), "end_date": fim.isoformat()}).status_code, 400)

    def test_avisa_agendamentos_existentes_no_periodo(self):
        dia = data_futura(3)
        Schedule.objects.create(date=dia, start_time=time(9, 0), barber=self.barbeiro,
                                client_name=criar_cliente(), service=criar_servico(self.barbeiro))
        resposta = self.client.post(self.url, {"start_date": dia.isoformat(), "end_date": dia.isoformat()})
        self.assertEqual(resposta.data["agendamentos_no_periodo"], 1)

    def test_lista_e_remove_bloqueio(self):
        dia = data_futura(3)
        folga_id = self.client.post(self.url, {"start_date": dia.isoformat(), "end_date": dia.isoformat()}).data["id"]
        self.assertEqual(len(self.client.get(self.url).data), 1)
        self.assertEqual(self.client.delete(f"{self.url}{folga_id}/").status_code, 204)
        self.assertFalse(Vacation.objects.exists())

    def test_outro_barbeiro_nao_remove_bloqueio(self):
        dia = data_futura(3)
        folga_id = self.client.post(self.url, {"start_date": dia.isoformat(), "end_date": dia.isoformat()}).data["id"]
        self.client.force_authenticate(criar_barbeiro("Diego").user)
        self.assertEqual(self.client.delete(f"{self.url}{folga_id}/").status_code, 404)
        self.assertTrue(Vacation.objects.exists())
