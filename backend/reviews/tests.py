from datetime import time

from rest_framework.test import APITestCase

from app.factories import criar_barbeiro, criar_cliente, criar_servico, data_futura
from schedule.models import Schedule
from .models import Review


class AvaliacaoTests(APITestCase):
    def setUp(self):
        self.barbeiro = criar_barbeiro()
        self.cliente = criar_cliente()
        self.servico = criar_servico(self.barbeiro)

    def concluir_atendimento(self):
        return Schedule.objects.create(date=data_futura(), start_time=time(9, 0), barber=self.barbeiro,
                                       client_name=self.cliente, service=self.servico, status="concluido")

    def avaliar(self, cliente, nota=9):
        self.client.force_authenticate(cliente.user)
        return self.client.post("/api/v1/reviews/", {"barber": self.barbeiro.id, "rating": nota, "comment": "Ótimo"})

    def test_exige_atendimento_concluido(self):
        resposta = self.avaliar(self.cliente)
        self.assertEqual(resposta.status_code, 400)
        self.assertFalse(Review.objects.exists())

    def test_avaliacao_fica_vinculada_ao_cliente_e_ao_atendimento(self):
        atendimento = self.concluir_atendimento()
        self.assertEqual(self.avaliar(self.cliente).status_code, 201)
        avaliacao = Review.objects.get()
        self.assertEqual(avaliacao.client, self.cliente)
        self.assertEqual(avaliacao.schedule, atendimento)

    def test_cada_atendimento_so_pode_ser_avaliado_uma_vez(self):
        self.concluir_atendimento()
        self.avaliar(self.cliente)
        self.assertEqual(self.avaliar(self.cliente).status_code, 400)
        self.assertEqual(Review.objects.count(), 1)

    def test_nota_fora_da_escala_e_recusada(self):
        self.concluir_atendimento()
        self.assertEqual(self.avaliar(self.cliente, nota=11).status_code, 400)

    def test_somente_o_autor_pode_editar_ou_excluir(self):
        self.concluir_atendimento()
        self.avaliar(self.cliente)
        avaliacao = Review.objects.get()
        url = f"/api/v1/reviews/{avaliacao.id}/"

        self.client.force_authenticate(criar_cliente("Bruno").user)
        self.assertEqual(self.client.delete(url).status_code, 404)

        self.client.force_authenticate(self.cliente.user)
        self.assertEqual(self.client.patch(url, {"rating": 7}).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
