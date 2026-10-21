"""Funções auxiliares para criar dados nos testes automatizados."""
from datetime import timedelta, time

from django.contrib.auth.models import User
from django.utils import timezone

from barber.models import Barber
from client.models import Client
from services.models import Services
from products.models import Product
from stock.models import Stock


def criar_barbeiro(nome="Carlos", inicio=time(8, 0), fim=time(12, 0), pausa_inicio=time(10, 0), pausa_fim=time(11, 0)):
    user = User.objects.create_user(username=f"barbeiro_{nome.lower()}", password="senha123")
    return Barber.objects.create(
        user=user, name=nome, email=f"{nome.lower()}@barbearia.com", phone="12999990000",
        work_start=inicio, work_end=fim, break_start=pausa_inicio, break_end=pausa_fim,
    )


def criar_cliente(nome="Ana"):
    user = User.objects.create_user(username=f"cliente_{nome.lower()}", password="senha123")
    return Client.objects.create(user=user, name=nome, email=f"{nome.lower()}@email.com", phone="12988880000")


def criar_servico(barbeiro, nome="Corte", preco="50.00", minutos=30):
    return Services.objects.create(barber=barbeiro, name=nome, price=preco, duration=timedelta(minutes=minutos))


def criar_produto(nome="Pomada", preco="30.00", quantidade=5):
    produto = Product.objects.create(name=nome, description="Produto de teste", price=preco, disponivel_na_loja=True)
    Stock.objects.create(product=produto, quantity=quantidade)
    return produto


def data_futura(dias=7):
    return timezone.localdate() + timedelta(days=dias)


# horários cheios usados na base de demonstração (fora do almoço, das 12h às 13h)
HORAS_ATENDIMENTO = (8, 9, 10, 11, 13, 14, 15, 16, 17, 18)


def popular_base(qtd_clientes=60, dias_passados=60, dias_futuros=30):
    """Cria uma base equivalente a alguns meses de uso: 3 barbeiros, 10 atendimentos por dia cada."""
    from datetime import time as hora
    from finance.models import Finances
    from reviews.models import Review
    from schedule.models import Schedule
    from store.models import Store

    barbeiros = [criar_barbeiro(nome) for nome in ("Carlos", "Diego", "Eduardo")]
    for b in barbeiros:
        b.work_start, b.work_end = hora(8, 0), hora(20, 0)
        b.break_start, b.break_end = hora(12, 0), hora(13, 0)  # almoço
        b.save()
        b.user.is_staff = True  # barbeiros acessam o painel financeiro
        b.user.save()
    clientes = [criar_cliente(f"Cliente{i}") for i in range(qtd_clientes)]
    servicos = [criar_servico(b, nome=f"Serviço {i}", minutos=30) for b in barbeiros for i in range(4)]
    produtos = [criar_produto(f"Produto {i}", quantidade=500) for i in range(30)]

    hoje = data_futura(0)
    agendamentos = []
    for dia in range(-dias_passados, dias_futuros):
        data = hoje + timedelta(days=dia)
        for b_idx, b in enumerate(barbeiros):
            for slot, h in enumerate(HORAS_ATENDIMENTO):
                agendamentos.append(Schedule(
                    date=data, start_time=hora(h, 0), end_time=hora(h, 30), barber=b,
                    client_name=clientes[(dia + slot) % qtd_clientes], service=servicos[b_idx * 4 + slot % 4],
                    status="concluido" if dia < 0 else "agendado",
                ))
    Schedule.objects.bulk_create(agendamentos)
    concluidos = list(Schedule.objects.filter(status="concluido").select_related("service"))
    Finances.objects.bulk_create([
        Finances(barber=s.barber, schedule=s, tipo="entrada", valor=s.service.price, date=s.date, payment_method="pix")
        for s in concluidos
    ])
    Review.objects.bulk_create([
        Review(barber=s.barber, client=s.client_name, schedule=s, rating=8, comment="Bom atendimento")
        for s in concluidos[:300]
    ])
    Store.objects.bulk_create([
        Store(stock=p.stock, client=clientes[i % qtd_clientes], barber=barbeiros[i % 3], quantity_sold=1, status="pendente")
        for i, p in enumerate(produtos * 3)
    ])
    return {"barbeiros": barbeiros, "clientes": clientes, "servicos": servicos,
            "produtos": produtos, "total_agendamentos": len(agendamentos)}
