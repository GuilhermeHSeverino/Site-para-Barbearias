"""Preenche o banco com uma barbearia de demonstração, como se o sistema já estivesse em uso.

Uso:
    python manage.py popular_demonstracao            # cria os dados
    python manage.py popular_demonstracao --apagar   # remove tudo o que este comando criou
    python manage.py popular_demonstracao --barbeiro email@dominio.com
        # preenche a agenda de um barbeiro já cadastrado com os clientes de demonstração

As contas criadas têm usuário iniciado por "demo_"; é por esse prefixo que o --apagar as encontra.
O que o --barbeiro cria fica ligado aos clientes de demonstração e sai junto no --apagar; só os
serviços que faltavam ao barbeiro continuam cadastrados.
"""
import getpass
import random
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone

from barber.models import Barber
from client.models import BarberClientNote, Client
from finance.models import Finances
from notifications.models import ClientNotification, Notification
from products.models import Product
from reviews.models import Review
from schedule.models import Schedule, Vacation, WaitlistEntry
from services.models import Services
from stock.models import Stock, StockMovement
from store.models import Store

PREFIXO = "demo_"
DIAS_PASSADOS = 90
DIAS_FUTUROS = 14
# horários de início (o almoço é das 12h às 13h); o serviço mais longo dura 50 min
HORAS = (8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19)

BARBEIROS = [
    ("Rafael Moreira", "rafael", "Especialista em cortes clássicos e barba na navalha, com 12 anos de profissão.",
     "Corte clássico, barba, toalha quente"),
    ("Lucas Andrade", "lucas", "Apaixonado por degradês e desenhos. Sempre atualizado com as tendências.",
     "Degradê, freestyle, pigmentação"),
    ("Thiago Ribeiro", "thiago", "Atendimento tranquilo e caprichado, do corte infantil à barba completa.",
     "Corte infantil, barba, sobrancelha"),
]

# nome, preço, minutos (no máximo 50, para caber entre um horário e o próximo), peso na escolha da agenda
SERVICOS = [
    ("Corte de cabelo", "45.00", 40, 30),
    ("Barba", "35.00", 30, 15),
    ("Corte + barba", "70.00", 50, 30),
    ("Degradê", "50.00", 40, 20),
    ("Sobrancelha", "15.00", 15, 3),
    ("Acabamento (pezinho)", "20.00", 15, 3),
    ("Hidratação capilar", "35.00", 30, 2),
    ("Lavagem e finalização", "25.00", 20, 2),
]
SERVICOS_POR_BARBEIRO = {
    "rafael": [("Barba na navalha com toalha quente", "45.00", 40, 8), ("Corte na tesoura", "55.00", 45, 6)],
    "lucas": [("Freestyle (desenho)", "30.00", 20, 5), ("Pigmentação de barba", "40.00", 30, 4),
              ("Relaxamento capilar", "60.00", 50, 2)],
    "thiago": [("Corte infantil", "35.00", 30, 8), ("Limpeza de pele", "50.00", 40, 2),
               ("Corte + barba + sobrancelha", "80.00", 50, 4)],
}

PRODUTOS = [  # nome, descrição, preço, custo unitário, quantidade, estoque mínimo
    ("Pomada modeladora efeito matte", "Fixação forte e acabamento seco, 120 g.", "39.90", "18.00", 24, 5),
    ("Óleo para barba", "Hidrata e perfuma a barba, 30 ml.", "34.90", "15.00", 18, 5),
    ("Balm para barba", "Amacia os fios e reduz o frizz, 60 g.", "32.90", "14.00", 4, 5),
    ("Shampoo antiqueda", "Uso diário, com cafeína, 250 ml.", "42.90", "20.00", 15, 4),
    ("Cera capilar brilho", "Fixação média com brilho, 80 g.", "29.90", "12.00", 20, 5),
    ("Pente de madeira", "Pente artesanal para barba e cabelo.", "24.90", "9.00", 3, 4),
    ("Loção pós-barba", "Refresca e acalma a pele após o barbear, 100 ml.", "36.90", "16.00", 12, 4),
    ("Kit barba completo", "Óleo, balm e pente em embalagem para presente.", "89.90", "45.00", 8, 3),
    ("Shampoo para barba", "Limpa sem ressecar, 150 ml.", "31.90", "13.00", 14, 4),
    ("Condicionador hidratante", "Para cabelos secos e ondulados, 250 ml.", "38.90", "17.00", 10, 4),
    ("Tônico capilar", "Fortalece a raiz e estimula o crescimento, 100 ml.", "49.90", "24.00", 9, 3),
    ("Gel fixação extra forte", "Efeito molhado com fixação duradoura, 300 g.", "22.90", "9.00", 26, 6),
    ("Spray fixador", "Finalização com fixação leve, 200 ml.", "27.90", "11.00", 16, 5),
    ("Escova para barba", "Cerdas naturais, alinha e distribui o óleo.", "44.90", "20.00", 7, 3),
    ("Pós-barba em gel", "Sem álcool, ideal para pele sensível, 120 g.", "33.90", "14.00", 2, 4),
]

CLIENTES = [
    "Pedro Henrique Souza", "Gabriel Martins", "Matheus Oliveira", "João Pedro Lima", "Felipe Carvalho",
    "Bruno Almeida", "Gustavo Rocha", "Leonardo Costa", "Vinícius Pereira", "Rodrigo Fernandes",
    "André Gomes", "Daniel Barbosa", "Eduardo Santos", "Marcelo Teixeira", "Ricardo Mendes",
    "Caio Nascimento", "Henrique Dias", "Samuel Cardoso", "Arthur Ramos", "Igor Freitas",
    "Murilo Castro", "Renan Pinto", "Otávio Moura", "Fábio Correia", "Diego Nogueira",
]
# o restante da clientela é montado combinando estes nomes, para a agenda ter uma frequência realista
TOTAL_CLIENTES = 180
PRIMEIROS_NOMES = ["Lucas", "Miguel", "Davi", "Bernardo", "Heitor", "Enzo", "Lorenzo", "Theo", "Nicolas", "Benjamin",
                   "Joaquim", "Bento", "Raul", "Vicente", "Emanuel", "Alexandre", "Paulo", "Sérgio", "Wagner", "Cláudio",
                   "Roberto", "Márcio", "Luiz", "Fernando", "Antônio", "Carlos", "José", "Rafael", "Thiago", "Leandro"]
SOBRENOMES = ["Silva", "Santos", "Souza", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Ribeiro", "Martins",
              "Araújo", "Melo", "Barros", "Vieira", "Monteiro", "Cunha", "Batista", "Campos", "Lopes", "Machado"]

COMENTARIOS = {
    10: ["Melhor barbearia da cidade, atendimento impecável!", "Corte perfeito, exatamente como eu pedi.",
         "Ambiente top e profissional muito atencioso.", "Sempre saio satisfeito. Recomendo demais!"],
    9: ["Muito bom, pontual e caprichoso.", "Ótimo atendimento, voltarei com certeza.",
        "Gostei muito do degradê, ficou bem feito."],
    8: ["Bom atendimento, só atrasou alguns minutos.", "Corte bom, preço justo."],
    7: ["Ficou bom, mas esperava um pouco mais no acabamento."],
}

NOTAS_CLIENTES = [
    "Prefere degradê baixo e máquina 1 nas laterais.",
    "Pele sensível: usar loção sem álcool na barba.",
    "Gosta de conversar sobre futebol. Torce para o Corinthians.",
    "Costuma vir a cada 15 dias, sempre no sábado de manhã.",
]


class Command(BaseCommand):
    help = "Cria uma barbearia de demonstração (barbeiros, clientes, agenda, loja, financeiro e avaliações)."

    def add_arguments(self, parser):
        parser.add_argument("--apagar", action="store_true", help="Remove os dados de demonstração.")
        parser.add_argument("--senha", help="Senha das contas de demonstração (se omitida, é pedida no terminal).")
        parser.add_argument("--sim", action="store_true", help="Não pede confirmação.")
        parser.add_argument("--barbeiro", help="E-mail de um barbeiro já cadastrado para receber atendimentos de demonstração.")

    def handle(self, *args, **opcoes):
        banco = connection.settings_dict
        destino = f"{connection.vendor} {banco.get('HOST') or banco.get('NAME')}"
        if opcoes["apagar"]:
            acao = "APAGAR os dados de demonstração de"
        elif opcoes["barbeiro"]:
            acao = f"adicionar atendimentos de demonstração ao barbeiro {opcoes['barbeiro']} em"
        else:
            acao = "criar dados de demonstração em"
        if not opcoes["sim"] and input(f"Vai {acao}: {destino}. Continuar? [s/N] ").strip().lower() != "s":
            raise CommandError("Cancelado.")

        if opcoes["barbeiro"]:
            barbeiro = Barber.objects.filter(email__iexact=opcoes["barbeiro"]).first()
            if barbeiro is None:
                raise CommandError(f"Nenhum barbeiro cadastrado com o e-mail {opcoes['barbeiro']}.")
            if barbeiro.user.username.startswith(PREFIXO):
                raise CommandError("Esse barbeiro já é de demonstração.")
            clientes = list(Client.objects.filter(user__username__startswith=PREFIXO).order_by("id"))
            if not clientes:
                raise CommandError("Não há clientes de demonstração. Rode o comando sem --barbeiro primeiro.")
            if Schedule.objects.filter(barber=barbeiro, client_name__in=clientes).exists():
                raise CommandError("Esse barbeiro já tem atendimentos de demonstração. Rode --apagar para refazer.")
            random.seed(barbeiro.id)
            with transaction.atomic():
                resumo = self.criar_para_barbeiro(barbeiro, clientes)
                self.etapa("Salvando tudo no banco...")
            self.stdout.write(self.style.SUCCESS(f"Atendimentos de demonstração adicionados a {barbeiro.name}."))
            for linha in resumo:
                self.stdout.write(linha)
            return

        if opcoes["apagar"]:
            self.etapa("Apagando os dados de demonstração...")
            with transaction.atomic():
                self.apagar()
            self.stdout.write(self.style.SUCCESS("Dados de demonstração removidos."))
            return

        if User.objects.filter(username__startswith=PREFIXO).exists():
            raise CommandError("Já existem dados de demonstração. Rode com --apagar antes de criar de novo.")
        senha = opcoes["senha"] or getpass.getpass("Senha das contas de demonstração: ")
        if len(senha) < 8:
            raise CommandError("Use uma senha com pelo menos 8 caracteres.")

        random.seed(2026)  # mesma base a cada execução
        with transaction.atomic():
            resumo = self.criar(senha)
            self.etapa("Salvando tudo no banco...")
        self.stdout.write(self.style.SUCCESS("Barbearia de demonstração criada."))
        for linha in resumo:
            self.stdout.write(linha)

    def apagar(self):
        usuarios = User.objects.filter(username__startswith=PREFIXO)
        barbeiros = Barber.objects.filter(user__in=usuarios)
        clientes = Client.objects.filter(user__in=usuarios)
        Finances.objects.filter(barber__in=barbeiros).delete()
        Review.objects.filter(barber__in=barbeiros).delete()
        # avisos de pedidos de clientes de demonstração enviados a barbeiros reais (os demais saem em cascata)
        for nome in clientes.values_list("name", flat=True):
            Notification.objects.filter(message__startswith=f"Novo pedido: {nome} reservou").delete()
        Store.objects.filter(client__in=clientes).delete()
        Schedule.objects.filter(barber__in=barbeiros).delete()
        Schedule.objects.filter(client_name__in=clientes).delete()
        Services.objects.filter(barber__in=barbeiros).delete()
        Product.objects.filter(name__in=[p[0] for p in PRODUTOS]).delete()
        usuarios.delete()

    def criar_para_barbeiro(self, barbeiro, clientes):
        """Agenda, financeiro, avaliações, pedidos e avisos para um barbeiro real, com os clientes de demonstração."""
        hoje = timezone.localdate()
        agora = timezone.localtime().time()

        self.etapa(f"Conferindo os serviços de {barbeiro.name}...")
        existentes = set(Services.objects.filter(barber=barbeiro).values_list("name", flat=True))
        criados = [Services.objects.create(barber=barbeiro, name=n, price=Decimal(p), duration=timedelta(minutes=m))
                   for n, p, m, _ in SERVICOS if n not in existentes]
        # só entram na agenda os serviços que cabem entre um horário e o próximo
        peso_por_nome = {n: peso for n, _, _, peso in SERVICOS}
        servicos = [s for s in Services.objects.filter(barber=barbeiro) if s.duration <= timedelta(minutes=50)]
        if not servicos:
            raise CommandError("O barbeiro não tem serviço de até 50 minutos para montar a agenda.")
        pesos = [peso_por_nome.get(s.name, 10) for s in servicos]

        # horários cheios dentro do expediente do barbeiro, fora do intervalo
        horas = [h for h in range(barbeiro.work_start.hour, barbeiro.work_end.hour)
                 if time(h, 50) <= barbeiro.work_end
                 and not (barbeiro.break_start <= time(h) < barbeiro.break_end
                          or barbeiro.break_start < time(h, 50) <= barbeiro.break_end)]
        folgas = list(Vacation.objects.filter(barber=barbeiro))
        ja_marcados = defaultdict(list)
        for s in Schedule.objects.filter(barber=barbeiro).exclude(status="cancelado"):
            ja_marcados[s.date].append((s.start_time, s.end_time))

        agendamentos = []
        for dia in range(-DIAS_PASSADOS, DIAS_FUTUROS + 1):
            data = hoje + timedelta(days=dia)
            if data.weekday() == 6 or any(f.start_date <= data <= f.end_date for f in folgas):
                continue
            for h in horas:
                ocupacao = 0.55 + (0.25 if data.weekday() >= 4 else 0) + (0.1 if h >= 17 else 0)
                if dia > 0:
                    ocupacao *= max(0.15, 0.7 - dia * 0.04)
                if random.random() > ocupacao:
                    continue
                inicio, fim = time(h), time(h, 50)
                if any(a < fim and inicio < b for a, b in ja_marcados[data]):
                    continue  # não mexe nos horários que o barbeiro já tem
                ja_passou = dia < 0 or (dia == 0 and inicio < agora)
                if ja_passou:
                    status = "cancelado" if random.random() < 0.07 else "concluido"
                else:
                    status = "agendado"  # as telas do sistema só criam horários "agendado"
                agendamentos.append(Schedule(date=data, start_time=inicio, barber=barbeiro,
                                             client_name=random.choice(clientes[1:]),
                                             service=random.choices(servicos, weights=pesos)[0], status=status))
        for i, s in enumerate(agendamentos, 1):
            s.save()
            if i % 200 == 0 or i == len(agendamentos):
                self.etapa(f"Agenda: {i} de {len(agendamentos)} agendamentos")

        concluidos = [s for s in agendamentos if s.status == "concluido"]
        self.etapa(f"Lançando no financeiro os {len(concluidos)} atendimentos concluídos...")
        formas = ("pix", "pix", "pix", "cartao_debito", "cartao_credito", "dinheiro")
        for s in concluidos:
            Finances.objects.create(barber=barbeiro, schedule=s, tipo="entrada", date=s.date,
                                    payment_method=random.choice(formas))

        avaliados = random.sample(concluidos, k=len(concluidos) // 3)
        self.etapa(f"Criando {len(avaliados)} avaliações...")
        for s in avaliados:
            nota = random.choices((10, 9, 8, 7), weights=(50, 30, 15, 5))[0]
            review = Review.objects.create(barber=barbeiro, client=s.client_name, schedule=s, rating=nota,
                                           comment=random.choice(COMENTARIOS[nota]) if random.random() < 0.7 else "")
            quando = min(timezone.make_aware(datetime.combine(s.date, s.end_time)) + timedelta(hours=2), timezone.now())
            Review.objects.filter(pk=review.pk).update(created_at=quando, updated_at=quando)

        # vendas da loja feitas por este barbeiro, com os produtos que ainda têm estoque
        self.etapa("Criando pedidos da loja...")
        estoques = [s for s in Stock.objects.select_related("product").filter(product__disponivel_na_loja=True)
                    if s.quantity > s.product.estoque_minimo + 3]
        vendas = random.sample(estoques, k=min(len(estoques), 12))
        for stock in vendas:
            data = hoje - timedelta(days=random.randint(1, DIAS_PASSADOS - 1))
            pedido = Store.objects.create(stock=stock, client=random.choice(clientes[1:]), barber=barbeiro,
                                          quantity_sold=1, date_of_sale=data, status="entregue")
            StockMovement.objects.create(product=stock.product, type="saida", quantity=1,
                                         description="Entrega de pedido da loja")
            Finances.objects.create(store=pedido, barber=barbeiro, tipo="entrada", valor=stock.product.price, date=data,
                                    payment_method=random.choice(formas), categoria="outros")
        pendentes = [Store.objects.create(stock=stock, client=random.choice(clientes[1:]), barber=barbeiro,
                                          quantity_sold=1, status="pendente")
                     for stock in random.sample(estoques, k=min(len(estoques), 2))]

        # avisos ligados ao atendimento, para saírem junto quando ele for apagado
        self.etapa("Criando notificações e anotações...")

        def avisar(mensagem, tipo, quando, lida, schedule=None):
            n = Notification.objects.create(barber=barbeiro, type=tipo, is_read=lida, message=mensagem, schedule=schedule)
            Notification.objects.filter(pk=n.pk).update(created_at=min(quando, timezone.now() - timedelta(minutes=10)))

        futuros = sorted((s for s in agendamentos if s.status in ("agendado", "confirmado")), key=lambda s: -s.id)
        for i, s in enumerate(futuros[:6]):
            avisar(f"Novo agendamento: {s.client_name.name} marcou {s.service.name} em "
                   f"{s.date.strftime('%d/%m/%Y')} às {s.start_time.strftime('%H:%M')}.",
                   "SYSTEM", timezone.now() - timedelta(hours=i * 5 + 1), i >= 3, s)
        for i, s in enumerate(sorted(avaliados, key=lambda s: s.date)[-4:]):
            avisar(f"Nova avaliação recebida: nota {s.review.rating}/10.", "REVIEW",
                   timezone.make_aware(datetime.combine(s.date, time(20))), i < 2, s)
        for pedido in pendentes:
            avisar(f"Novo pedido: {pedido.client.name} reservou 1 unidade(s) de {pedido.stock.product.name} para retirada.",
                   "SYSTEM", timezone.now() - timedelta(hours=random.randint(1, 30)), False)
        atendidos = list({s.client_name_id: s.client_name for s in concluidos}.values())
        for cliente, nota in zip(random.sample(atendidos, k=min(len(atendidos), len(NOTAS_CLIENTES))), NOTAS_CLIENTES):
            BarberClientNote.objects.get_or_create(barber=barbeiro, client=cliente, defaults={"note": nota})

        return [
            f"  {len(criados)} serviços adicionados ({len(servicos)} usados na agenda)",
            f"  {len(agendamentos)} agendamentos ({len(concluidos)} concluídos), {len(avaliados)} avaliações",
            f"  {len(vendas)} vendas e {len(pendentes)} pedidos pendentes na loja",
        ]

    def etapa(self, texto):
        # mostra o andamento: no Neon cada gravação vai pela internet e o comando leva alguns minutos
        self.stdout.write(f"[{timezone.localtime():%H:%M:%S}] {texto}")
        self.stdout.flush()

    def criar(self, senha):
        hoje = timezone.localdate()
        agora = timezone.localtime().time()

        self.etapa("Criando barbeiros, clientes e serviços...")
        barbeiros = []
        for nome, login, bio, especialidades in BARBEIROS:
            user = User.objects.create_user(username=f"{PREFIXO}{login}", email=f"{login}@barbeariademo.com.br",
                                            password=senha, first_name=nome.split()[0], is_staff=True)
            barbeiros.append(Barber.objects.create(
                user=user, name=nome, email=user.email, phone=f"(12) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}",
                bio=bio, specialties=especialidades, work_start=time(8), work_end=time(20),
                break_start=time(12), break_end=time(13),
            ))

        nomes, logins = [], set()
        candidatos = CLIENTES + [f"{p} {s}" for p in PRIMEIROS_NOMES for s in random.sample(SOBRENOMES, k=len(SOBRENOMES))]
        for nome in candidatos:
            login = (nome.lower().split()[0] + nome.lower().split()[-1]).translate(str.maketrans("áéíóúâêôãõç", "aeiouaeoaoc"))
            if login not in logins and len(nomes) < TOTAL_CLIENTES:
                logins.add(login)
                nomes.append((nome, login))
        # o hash da senha é lento de propósito: calculado uma vez e gravado em lote
        senha_hash = make_password(senha)
        usuarios = User.objects.bulk_create([User(username=f"{PREFIXO}{login}", email=f"{login}@email.com",
                                                  password=senha_hash, first_name=nome.split()[0]) for nome, login in nomes])
        Client.objects.bulk_create([
            Client(user=u, name=nome, email=u.email, phone=f"(12) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}")
            for u, (nome, _) in zip(usuarios, nomes)
        ])
        por_email = {c.email: c for c in Client.objects.filter(user__in=User.objects.filter(username__startswith=PREFIXO))}
        clientes = [por_email[f"{login}@email.com"] for _, login in nomes]
        cliente_principal = clientes[0]

        servicos, pesos = {}, {}
        for b, (_, login, _, _) in zip(barbeiros, BARBEIROS):
            lista = SERVICOS + SERVICOS_POR_BARBEIRO[login]
            servicos[b.id] = [Services.objects.create(barber=b, name=n, price=Decimal(p), duration=timedelta(minutes=m))
                              for n, p, m, _ in lista]
            pesos[b.id] = [peso for *_, peso in lista]

        # agenda: mais movimento no fim de semana e no fim do dia; domingo fechado
        agendamentos = []
        for dia in range(-DIAS_PASSADOS, DIAS_FUTUROS + 1):
            data = hoje + timedelta(days=dia)
            if data.weekday() == 6:
                continue
            for b in barbeiros:
                for h in HORAS:
                    ocupacao = 0.55 + (0.25 if data.weekday() >= 4 else 0) + (0.1 if h >= 17 else 0)
                    if dia > 0:
                        ocupacao *= max(0.15, 0.7 - dia * 0.04)  # a agenda futura vai enchendo aos poucos
                    if random.random() > ocupacao:
                        continue
                    inicio = time(h)  # a agenda trabalha de 30 em 30 minutos
                    ja_passou = dia < 0 or (dia == 0 and inicio < agora)
                    if ja_passou:
                        status = "cancelado" if random.random() < 0.07 else "concluido"
                    else:
                        status = "agendado"  # as telas do sistema só criam horários "agendado"
                    cliente = random.choice(clientes[1:])
                    agendamentos.append(Schedule(date=data, start_time=inicio, barber=b, client_name=cliente,
                                                 service=random.choices(servicos[b.id], weights=pesos[b.id])[0],
                                                 status=status))
        for i, s in enumerate(agendamentos, 1):  # o save() calcula o horário de término pela duração do serviço
            s.save()
            if i % 200 == 0 or i == len(agendamentos):
                self.etapa(f"Agenda: {i} de {len(agendamentos)} agendamentos")

        # o cliente principal sempre tem histórico e um próximo horário para mostrar na apresentação
        b0 = barbeiros[0]
        for dias, status in ((-75, "concluido"), (-60, "concluido"), (-45, "concluido"), (-30, "concluido"),
                             (-15, "concluido"), (3, "agendado")):
            data = hoje + timedelta(days=dias)
            if data.weekday() == 6:
                data += timedelta(days=1)
            ocupados = set(Schedule.objects.filter(barber=b0, date=data).values_list("start_time", flat=True))
            livre = next((time(h) for h in HORAS if time(h) not in ocupados), None)
            if livre:
                agendamentos.append(Schedule.objects.create(date=data, start_time=livre, barber=b0,
                                                            client_name=cliente_principal,
                                                            service=servicos[b0.id][2], status=status))

        concluidos = [s for s in agendamentos if s.status == "concluido"]
        self.etapa(f"Lançando no financeiro os {len(concluidos)} atendimentos concluídos...")
        formas = ("pix", "pix", "pix", "cartao_debito", "cartao_credito", "dinheiro")
        for s in concluidos:
            Finances.objects.create(barber=s.barber, schedule=s, tipo="entrada", date=s.date,
                                    payment_method=random.choice(formas))

        # avaliações de parte dos atendimentos concluídos
        avaliados = random.sample(concluidos, k=len(concluidos) // 3)
        self.etapa(f"Criando {len(avaliados)} avaliações...")
        for s in avaliados:
            nota = random.choices((10, 9, 8, 7), weights=(50, 30, 15, 5))[0]
            review = Review.objects.create(barber=s.barber, client=s.client_name, schedule=s, rating=nota,
                                           comment=random.choice(COMENTARIOS[nota]) if random.random() < 0.7 else "")
            quando = min(timezone.make_aware(datetime.combine(s.date, s.end_time)) + timedelta(hours=2), timezone.now())
            Review.objects.filter(pk=review.pk).update(created_at=quando, updated_at=quando)

        # loja: produtos com estoque, compras lançadas como saída e pedidos entregues e pendentes
        self.etapa("Criando produtos e pedidos da loja...")
        produtos = []
        for nome, descricao, preco, custo, qtd, minimo in PRODUTOS:
            produto = Product.objects.create(name=nome, description=descricao, price=Decimal(preco),
                                             estoque_minimo=minimo, disponivel_na_loja=True)
            Stock.objects.create(product=produto, quantity=0)
            vendidos = random.randint(8, 16)
            # compra inicial e uma reposição no meio do período, as duas lançadas como saída no financeiro
            inicial = (qtd + vendidos) * 3 // 5
            for compra, dias, descricao_mov in ((inicial, DIAS_PASSADOS, "Estoque inicial"),
                                                (qtd + vendidos - inicial, DIAS_PASSADOS // 2, "Reposição de estoque")):
                StockMovement.objects.create(product=produto, type="entrada", quantity=compra, description=descricao_mov)
                Finances.objects.create(tipo="saida", valor=Decimal(custo) * compra, date=hoje - timedelta(days=dias),
                                        categoria="produtos", barber=b0, descricao=f"Compra de {compra} un. de {nome}")
            produtos.append((produto, vendidos))

        for produto, vendidos in produtos:
            restantes = vendidos
            while restantes > 0:
                qtd = min(restantes, random.choice((1, 1, 2)))
                restantes -= qtd
                data = hoje - timedelta(days=random.randint(1, DIAS_PASSADOS - 1))
                barbeiro = random.choice(barbeiros)
                cliente = random.choice(clientes[1:])
                pedido = Store.objects.create(stock=produto.stock, client=cliente, barber=barbeiro,
                                              quantity_sold=qtd, date_of_sale=data, status="entregue")
                StockMovement.objects.create(product=produto, type="saida", quantity=qtd,
                                             description="Entrega de pedido da loja")
                Finances.objects.create(store=pedido, barber=barbeiro, tipo="entrada", valor=produto.price * qtd,
                                        date=data, payment_method=random.choice(formas), categoria="outros")
        # pedidos em aberto: cada barbeiro tem alguns para confirmar a entrega
        pendentes = []
        for produto, _ in random.sample(produtos, k=6):
            pendentes.append(Store.objects.create(stock=produto.stock, client=random.choice(clientes[1:]),
                                                  barber=random.choice(barbeiros), quantity_sold=random.choice((1, 1, 2)),
                                                  status="pendente"))
        pendentes.append(Store.objects.create(stock=produtos[0][0].stock, client=cliente_principal, barber=b0,
                                              quantity_sold=1, status="pendente"))
        for produto, _ in random.sample(produtos, k=3):
            Store.objects.create(stock=produto.stock, client=random.choice(clientes), barber=random.choice(barbeiros),
                                 quantity_sold=1, status="cancelado",
                                 date_of_sale=hoje - timedelta(days=random.randint(2, 40)))
        # o cliente principal sempre tem compras entregues no histórico da loja
        for produto, dias in ((produtos[1][0], 40), (produtos[7][0], 25), (produtos[4][0], 10)):
            pedido = Store.objects.create(stock=produto.stock, client=cliente_principal, barber=b0, quantity_sold=1,
                                          date_of_sale=hoje - timedelta(days=dias), status="entregue")
            StockMovement.objects.create(product=produto, type="saida", quantity=1, description="Entrega de pedido da loja")
            Finances.objects.create(store=pedido, barber=b0, tipo="entrada", valor=produto.price, date=pedido.date_of_sale,
                                    payment_method="pix", categoria="outros")

        # despesas fixas de cada mês
        self.etapa("Lançando as despesas de cada mês...")
        primeiro_mes = (hoje - timedelta(days=DIAS_PASSADOS)).replace(day=1)
        mes = primeiro_mes
        while mes <= hoje:
            for dia, valor, categoria, descricao in ((5, "2500.00", "aluguel", "Aluguel do salão"),
                                                     (10, "420.00", "utilidades", "Conta de luz"),
                                                     (10, "130.00", "utilidades", "Conta de água"),
                                                     (12, "120.00", "utilidades", "Internet"),
                                                     (15, "300.00", "marketing", "Anúncios no Instagram"),
                                                     (18, "180.00", "produtos", "Lâminas, toalhas e capas descartáveis"),
                                                     (20, "150.00", "outros", "Contador"),
                                                     (25, "90.00", "outros", "Manutenção das máquinas")):
                data = mes.replace(day=dia)
                if hoje - timedelta(days=DIAS_PASSADOS) <= data <= hoje:
                    Finances.objects.create(tipo="saida", valor=valor, date=data, categoria=categoria,
                                            barber=b0, descricao=descricao)
            mes = (mes + timedelta(days=32)).replace(day=1)

        # anotações, folga, lista de espera e notificações
        self.etapa("Criando anotações, folga e notificações...")
        for b in barbeiros:
            for cliente, nota in zip(random.sample(clientes, k=len(NOTAS_CLIENTES)), NOTAS_CLIENTES):
                BarberClientNote.objects.create(barber=b, client=cliente, note=nota)
        BarberClientNote.objects.update_or_create(barber=b0, client=cliente_principal,
                                                  defaults={"note": NOTAS_CLIENTES[0]})
        inicio_folga = hoje + timedelta(days=20)
        Vacation.objects.create(barber=barbeiros[2], start_date=inicio_folga, end_date=inicio_folga + timedelta(days=4))
        proximo_sabado = hoje + timedelta(days=(5 - hoje.weekday()) % 7 or 7)
        for cliente in random.sample(clientes[1:], k=2):
            WaitlistEntry.objects.create(client=cliente, barber=b0, service=servicos[b0.id][2], date=proximo_sabado)

        # notificações com as mesmas mensagens que o sistema gera, datadas de quando o fato aconteceu
        def avisar_barbeiro(barbeiro, mensagem, tipo, quando, lida):
            n = Notification.objects.create(barber=barbeiro, type=tipo, is_read=lida, message=mensagem)
            Notification.objects.filter(pk=n.pk).update(created_at=quando)

        def avisar_cliente(cliente, mensagem, quando, lida):
            n = ClientNotification.objects.create(client=cliente, is_read=lida, message=mensagem)
            ClientNotification.objects.filter(pk=n.pk).update(created_at=quando)

        def momento(data, hora=time(9)):
            # nenhum aviso pode ter data no futuro
            return min(timezone.make_aware(datetime.combine(data, hora)), timezone.now() - timedelta(minutes=10))

        def dia_hora(s):
            return f"{s.date.strftime('%d/%m/%Y')} às {s.start_time.strftime('%H:%M')}"

        futuros = [s for s in agendamentos if s.status in ("agendado", "confirmado")]
        cancelados = sorted((s for s in agendamentos if s.status == "cancelado"), key=lambda s: s.date)
        for b in barbeiros:
            for i, s in enumerate(sorted((s for s in futuros if s.barber == b), key=lambda s: -s.id)[:6]):
                avisar_barbeiro(b, f"Novo agendamento: {s.client_name.name} marcou {s.service.name} em {dia_hora(s)}.",
                                "SYSTEM", timezone.now() - timedelta(hours=i * 5 + 1), i >= 3)
            for i, s in enumerate([s for s in cancelados if s.barber == b][-2:]):
                avisar_barbeiro(b, f"Agendamento cancelado pelo cliente {s.client_name.name}: {dia_hora(s)}.",
                                "SYSTEM", momento(s.date - timedelta(days=1), time(19)), True)
            for i, s in enumerate(sorted((s for s in avaliados if s.barber == b), key=lambda s: s.date)[-4:]):
                avisar_barbeiro(b, f"Nova avaliação recebida: nota {s.review.rating}/10.", "REVIEW",
                                momento(s.date, time(20)), i < 2)
        for pedido in pendentes:
            avisar_barbeiro(pedido.barber, f"Novo pedido: {pedido.client.name} reservou {pedido.quantity_sold} unidade(s) "
                                           f"de {pedido.stock.product.name} para retirada.",
                            "SYSTEM", timezone.now() - timedelta(hours=random.randint(1, 30)), False)
        for entrada in WaitlistEntry.objects.filter(barber=b0):
            avisar_barbeiro(b0, f"{entrada.client.name} entrou na lista de espera para {entrada.service.name} "
                                f"em {entrada.date.strftime('%d/%m/%Y')}.", "SYSTEM", timezone.now() - timedelta(hours=3), False)
        for produto, _ in produtos:
            produto.stock.refresh_from_db()
            if produto.stock.quantity <= produto.estoque_minimo:
                avisar_barbeiro(b0, f"Estoque baixo: {produto.name} está com {produto.stock.quantity} unidade(s).",
                                "STOCK_LOW", timezone.now() - timedelta(days=1), False)

        # caixa de notificações do cliente principal: confirmações, conclusões e pedidos
        meus = sorted((s for s in agendamentos if s.client_name == cliente_principal), key=lambda s: s.date)[-8:]
        for s in meus:
            avisar_cliente(cliente_principal, f"Agendamento confirmado com {s.barber.name} em {dia_hora(s)}.",
                           momento(s.date - timedelta(days=3), time(18)), s.date < hoje)
            if s.status == "concluido":
                avisar_cliente(cliente_principal, f"Seu atendimento com {s.barber.name} foi concluído. Avalie sua experiência.",
                               momento(s.date, s.end_time), s != [m for m in meus if m.status == "concluido"][-1])
        for pedido in Store.objects.filter(client=cliente_principal):
            avisar_cliente(cliente_principal, f"Pedido de {pedido.quantity_sold} unidade(s) de {pedido.stock.product.name} "
                                              f"recebido. Aguarde a confirmação da entrega.",
                           momento(pedido.date_of_sale, time(10)), pedido.status != "pendente")
            if pedido.status == "entregue":
                avisar_cliente(cliente_principal, f"Pedido de {pedido.stock.product.name} confirmado para retirada. "
                                                  f"Pagamento registrado na entrega.",
                               momento(pedido.date_of_sale, time(16)), True)

        return [
            f"  {len(barbeiros)} barbeiros, {len(clientes)} clientes, {len(PRODUTOS)} produtos",
            f"  {len(agendamentos)} agendamentos ({len(concluidos)} concluídos), {len(avaliados)} avaliações",
            f"  {Store.objects.filter(client__in=clientes).count()} pedidos da loja",
            "Para entrar (todas com a senha informada):",
            *[f"  barbeiro: {b.email}" for b in barbeiros],
            f"  cliente:  {cliente_principal.email}",
        ]
