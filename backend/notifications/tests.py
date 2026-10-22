from datetime import time, timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from app.factories import criar_barbeiro, criar_cliente, criar_produto, criar_servico, data_futura
from schedule.models import Schedule
from .models import ClientNotification, Notification


class LembretesTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.cliente = criar_cliente()
        self.servico = criar_servico(self.barbeiro, nome="Corte e Barba")

    def agendar_daqui_a(self, minutos, status="agendado"):
        inicio = timezone.localtime() + timedelta(minutes=minutos)
        return Schedule.objects.create(date=inicio.date(), start_time=inicio.time().replace(second=0, microsecond=0),
                                       barber=self.barbeiro, client_name=self.cliente, service=self.servico, status=status)

    def lembretes_do_barbeiro(self):
        self.client.force_authenticate(self.barbeiro.user)
        self.client.get("/api/v1/notifications/")
        return Notification.objects.filter(barber=self.barbeiro, type="REMINDER")

    def test_barbeiro_recebe_um_unico_lembrete_minutos_antes(self):
        self.agendar_daqui_a(5)
        self.assertEqual(self.lembretes_do_barbeiro().count(), 1)
        self.assertEqual(self.lembretes_do_barbeiro().count(), 1)  # consultar de novo não duplica
        self.assertIn("Corte e Barba", self.lembretes_do_barbeiro().get().message)

    def test_sem_lembrete_para_atendimento_distante_ou_cancelado(self):
        self.agendar_daqui_a(60)
        self.agendar_daqui_a(5, status="cancelado")
        self.assertFalse(self.lembretes_do_barbeiro().exists())

    def test_cliente_recebe_lembrete_nas_24_horas_anteriores(self):
        self.agendar_daqui_a(120)
        self.client.force_authenticate(self.cliente.user)
        resposta = self.client.get("/api/v1/client-notifications/")
        self.assertEqual(len(resposta.data), 1)
        self.assertIn(self.barbeiro.name, resposta.data[0]["message"])

    def test_cliente_nao_acessa_notificacoes_do_barbeiro(self):
        self.client.force_authenticate(self.cliente.user)
        self.assertEqual(self.client.get("/api/v1/notifications/").status_code, 403)


class AvisosDeEventosTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.cliente = criar_cliente()
        self.servico = criar_servico(self.barbeiro)

    def test_folga_avisa_clientes_com_horario_marcado(self):
        dia = data_futura(3)
        Schedule.objects.create(date=dia, start_time=time(9, 0), barber=self.barbeiro,
                                client_name=self.cliente, service=self.servico)
        self.client.force_authenticate(self.barbeiro.user)
        self.client.post("/api/v1/schedule/vacations/", {"start_date": dia.isoformat(), "end_date": dia.isoformat()})
        aviso = ClientNotification.objects.get(client=self.cliente)
        self.assertIn("remarcado", aviso.message)

    def test_lista_de_espera_e_estoque_baixo_avisam_o_barbeiro(self):
        self.client.force_authenticate(self.cliente.user)
        self.client.post("/api/v1/schedule/waitlist/", {"barber": self.barbeiro.id, "service": self.servico.id,
                                                         "date": data_futura(3).isoformat()})
        self.assertTrue(Notification.objects.filter(barber=self.barbeiro, message__contains="lista de espera").exists())

        produto = criar_produto("Pomada", quantidade=6)  # estoque mínimo padrão: 5
        self.client.force_authenticate(self.barbeiro.user)
        self.client.post("/api/v1/stock-movements/", {"product": produto.id, "type": "saida", "quantity": 2})
        self.assertTrue(Notification.objects.filter(barber=self.barbeiro, type="STOCK_LOW").exists())
