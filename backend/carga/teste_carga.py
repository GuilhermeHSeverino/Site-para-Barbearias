"""Teste de carga da API: vários usuários usando o sistema ao mesmo tempo.

Uso (dentro da pasta backend, com o ambiente virtual ativo):
    python carga/teste_carga.py
    python carga/teste_carga.py --usuarios 10 25 50 --duracao 20

O script cria um banco SQLite temporário (os dados reais não são tocados), popula-o com
alguns meses de uso, sobe a API com o servidor waitress e simula usuários simultâneos,
cada um repetindo ações típicas de clientes e barbeiros sem pausa entre elas. Ao final,
mostra a vazão (requisições por segundo), os tempos de resposta e a taxa de erros.
"""
import argparse
import json
import os
import random
import socket
import statistics
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import timedelta
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
PORTA = 8765
URL_BASE = f"http://127.0.0.1:{PORTA}/api/v1"
LIMITE_MS = 500


def preparar_ambiente(banco):
    os.environ["DATABASE_URL"] = f"sqlite:///{banco.as_posix()}"
    os.environ["DJANGO_DEBUG"] = "False"  # mesmo modo usado em produção
    os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
    for var in ("EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD"):
        os.environ.pop(var, None)  # nenhum e-mail real é enviado
    sys.path.insert(0, str(BACKEND))
    import django
    django.setup()


def popular_banco():
    from django.core.management import call_command
    from django.db import connections
    from app.factories import popular_base
    call_command("migrate", verbosity=0)
    base = popular_base()
    connections.close_all()
    return base


def gerar_tokens(base):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = lambda user: str(RefreshToken.for_user(user).access_token)
    return {
        "clientes": [token(c.user) for c in base["clientes"]],
        "barbeiros": [(token(b.user), b.id) for b in base["barbeiros"]],
    }


def subir_servidor(threads):
    processo = subprocess.Popen(
        # o waitress só repassa o X-Forwarded-Proto (HTTPS) de proxies confiáveis, como faz o proxy do Render
        [sys.executable, "-m", "waitress", f"--listen=127.0.0.1:{PORTA}", f"--threads={threads}",
         "--trusted-proxy=127.0.0.1", "--trusted-proxy-headers=x-forwarded-proto", "app.wsgi:application"],
        cwd=BACKEND, env=os.environ.copy(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(100):
        try:
            socket.create_connection(("127.0.0.1", PORTA), timeout=0.2).close()
            return processo
        except OSError:
            time.sleep(0.1)
    processo.kill()
    raise RuntimeError("O servidor não iniciou.")


def requisicao(metodo, caminho, token, corpo=None):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(URL_BASE + caminho, data=dados, method=metodo, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",  # em produção o proxy do Render informa HTTPS
    })
    inicio = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
            status = resp.status
    except urllib.error.HTTPError as erro:
        status = erro.code
    except Exception:
        status = 0  # falha de conexão ou tempo esgotado
    return (time.perf_counter() - inicio) * 1000, status


def acao_aleatoria(base, tokens, servicos_por_barbeiro, hoje):
    """Sorteia uma ação típica, com pesos que imitam o uso real (mais leituras que escritas)."""
    sorteio = random.random()
    token_cliente = random.choice(tokens["clientes"])
    token_barbeiro, barbeiro_id = random.choice(tokens["barbeiros"])
    servico_id = random.choice(servicos_por_barbeiro[barbeiro_id])
    if sorteio < 0.30:
        data = (hoje + timedelta(days=random.randint(1, 25))).isoformat()
        return "Consulta de horários livres", "GET", f"/schedule/availability/?barber_id={barbeiro_id}&service_id={servico_id}&date={data}", token_cliente, None
    if sorteio < 0.45:
        return "Histórico do cliente", "GET", "/schedule/", token_cliente, None
    if sorteio < 0.60:
        return "Catálogo de serviços", "GET", "/services/", token_cliente, None
    if sorteio < 0.75:
        data = (hoje + timedelta(days=random.randint(31, 365))).isoformat()
        hora = f"{random.randint(8, 19):02d}:{random.choice(['00', '30'])}"
        corpo = {"date": data, "start_time": hora, "barber": barbeiro_id, "service": servico_id}
        return "Criação de agendamento", "POST", "/schedule/", token_cliente, corpo
    if sorteio < 0.85:
        semana = f"data_inicio={hoje.isoformat()}&data_fim={(hoje + timedelta(days=6)).isoformat()}"
        return "Agenda do barbeiro", "GET", f"/schedule/?{semana}", token_barbeiro, None
    if sorteio < 0.95:
        return "Painel financeiro", "GET", "/finance/?periodo=mensal", token_barbeiro, None
    return "Pedidos pendentes da loja", "GET", "/stores/pending/", token_barbeiro, None


def rodar_nivel(qtd_usuarios, duracao, pausa, base, tokens):
    from django.utils import timezone
    hoje = timezone.localdate()
    servicos_por_barbeiro = {}
    for s in base["servicos"]:
        servicos_por_barbeiro.setdefault(s.barber_id, []).append(s.id)

    resultados, trava = [], threading.Lock()
    fim = time.perf_counter() + duracao

    def usuario_virtual():
        locais = []
        while time.perf_counter() < fim:
            nome, metodo, caminho, token, corpo = acao_aleatoria(base, tokens, servicos_por_barbeiro, hoje)
            ms, status = requisicao(metodo, caminho, token, corpo)
            locais.append((nome, ms, status))
            if pausa:
                # tempo que uma pessoa leva entre uma ação e outra (sorteado em torno da média)
                time.sleep(random.uniform(0.5 * pausa, 1.5 * pausa))
        with trava:
            resultados.extend(locais)

    threads = [threading.Thread(target=usuario_virtual) for _ in range(qtd_usuarios)]
    inicio = time.perf_counter()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return resultados, time.perf_counter() - inicio


def percentil(valores, p):
    valores = sorted(valores)
    return valores[max(0, int(round(len(valores) * p / 100)) - 1)]


def resumir(qtd_usuarios, resultados, tempo_total):
    tempos = [ms for _, ms, _ in resultados]
    # 400 em criação de agendamento é a regra de negócio recusando conflito, não uma falha do servidor
    erros = [r for r in resultados if r[2] == 0 or r[2] >= 500 or r[2] in (401, 403)]
    return {
        "usuarios": qtd_usuarios,
        "requisicoes": len(resultados),
        "vazao": len(resultados) / tempo_total,
        "media": statistics.mean(tempos),
        "p95": percentil(tempos, 95),
        "maximo": max(tempos),
        "erros": len(erros),
        "taxa_erros": 100 * len(erros) / len(resultados),
        "por_rota": {
            nome: percentil([ms for n, ms, _ in resultados if n == nome], 95)
            for nome in sorted({n for n, _, _ in resultados})
        },
        "erros_detalhe": sorted({(n, st) for n, _, st in erros}),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--usuarios", type=int, nargs="+", default=[10, 25, 50])
    parser.add_argument("--duracao", type=int, default=20, help="segundos por nível de carga")
    parser.add_argument("--threads", type=int, default=8, help="threads do servidor")
    parser.add_argument("--pausa", type=float, default=0, help="segundos, em média, entre as ações de cada usuário (0 = sem pausa)")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as pasta:
        banco = Path(pasta) / "carga.sqlite3"
        preparar_ambiente(banco)
        print("Preparando banco temporário...")
        base = popular_banco()
        print(f"Base: {base['total_agendamentos']} agendamentos, {len(base['clientes'])} clientes, 3 barbeiros")

        servidor = subir_servidor(args.threads)
        try:
            resumos = []
            for qtd in args.usuarios:
                tokens = gerar_tokens(base)  # tokens novos a cada nível (expiram em 5 minutos)
                print(f"\nSimulando {qtd} usuários simultâneos por {args.duracao} s...")
                resultados, tempo_total = rodar_nivel(qtd, args.duracao, args.pausa, base, tokens)
                resumo = resumir(qtd, resultados, tempo_total)
                resumos.append(resumo)
                for rota, p95 in resumo["por_rota"].items():
                    print(f"  {rota:30} p95 {p95:8.1f} ms")
                for rota, status in resumo["erros_detalhe"]:
                    qtd_erro = sum(1 for n, _, st in resultados if n == rota and st == status)
                    print(f"  erro {status or 'sem resposta'} em {rota}: {qtd_erro}x")
        finally:
            from django.db import connections
            connections.close_all()
            servidor.terminate()
            servidor.wait(timeout=10)

    print(f"\n{'Usuários':>9} {'Requisições':>12} {'Req/s':>7} {'Média':>9} {'p95':>9} {'Máximo':>9} {'Erros':>7}")
    for r in resumos:
        print(f"{r['usuarios']:>9} {r['requisicoes']:>12} {r['vazao']:>7.1f} {r['media']:>7.1f}ms "
              f"{r['p95']:>7.1f}ms {r['maximo']:>7.1f}ms {r['taxa_erros']:>6.2f}%")
    cenario = f"pausa média de {args.pausa:g} s entre ações" if args.pausa else "sem pausa entre ações (estresse)"
    print(f"\nCenário: {cenario}. Limite do RNF01: {LIMITE_MS} ms. Ambiente: {sys.platform}, Python {sys.version.split()[0]}, SQLite, servidor waitress com {args.threads} threads.")


if __name__ == "__main__":
    main()
