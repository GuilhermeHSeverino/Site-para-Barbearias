import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import "./MenuCliente.css";

function MenuCliente() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesPermitidas, setNotificacoesPermitidas] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  useEffect(() => {
    api.get("/api/v1/schedule/")
      .then((res) => setAgendamentos(res.data))
      .catch((error) => console.error("Erro ao carregar resumo do cliente:", error))
      .finally(() => setLoading(false));
    api.get("/api/v1/client-notifications/").then((res) => setNotificacoes(res.data.filter((item) => !item.is_read))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!notificacoesPermitidas || !agendamentos.length) return;
    const agora = new Date();
    const formatarData = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const hoje = formatarData(agora);
    const amanhaDate = new Date(agora);
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanha = formatarData(amanhaDate);
    const proximo = agendamentos
      .filter((item) => ["agendado", "confirmado"].includes(item.status) && [hoje, amanha].includes(item.date))
      .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`))[0];

    if (!proximo) return;
    const chave = `lembrete-${proximo.id}-${proximo.date}`;
    if (localStorage.getItem(chave)) return;
    new Notification(proximo.date === hoje ? "Seu corte é hoje" : "Seu corte é amanhã", {
      body: `${proximo.start_time.slice(0, 5)} · Confira seu agendamento na Barbearia.`,
      icon: "/favicon.ico",
    });
    localStorage.setItem(chave, "1");
  }, [agendamentos, notificacoesPermitidas]);

  const ativarNotificacoes = async () => {
    if (typeof Notification === "undefined") return;
    const permissao = await Notification.requestPermission();
    setNotificacoesPermitidas(permissao === "granted");
  };

  const opcoes = [
    { nome: "Agendar horário", desc: "Escolha barbeiro, serviço e horário", icone: "＋", rota: "/cliente/agendar" },
    { nome: "Meus agendamentos", desc: "Confira seus próximos atendimentos", icone: "◷", rota: "/cliente/historico" },
    { nome: "Loja da barbearia", desc: "Produtos e cuidados para levar para casa", icone: "◇", rota: "/cliente/loja" },
    { nome: "Avaliar atendimento", desc: "Conte como foi sua experiência", icone: "★", rota: "/cliente/feedback" },
  ];

  const agora = new Date();
  const formatarData = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const hoje = formatarData(agora);
  const amanhaDate = new Date(agora);
  amanhaDate.setDate(amanhaDate.getDate() + 1);
  const amanha = formatarData(amanhaDate);
  const proximo = agendamentos
    .filter((item) => ["agendado", "confirmado"].includes(item.status) && item.date >= hoje)
    .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`))[0];
  const textoLembrete = proximo && proximo.date === hoje ? "Seu corte é hoje" : proximo && proximo.date === amanha ? "Seu corte é amanhã" : "";

  return (
    <div className="cliente-home">
      <section className="cliente-hero">
        <div>
          <span className="cliente-eyebrow">Área do cliente</span>
          <h1>Sua próxima visita<br />está aqui.</h1>
          <p>Consulte seu próximo atendimento, agende um novo horário e acompanhe tudo com a barbearia.</p>
        </div>
        <Link to="/cliente/agendar" className="cliente-hero-acao">Novo agendamento <span>→</span></Link>
      </section>

      {textoLembrete && <Link to="/cliente/historico" className="cliente-lembrete"><span>⏰</span><strong>{textoLembrete}</strong><small>Confira os detalhes do seu agendamento e avise a barbearia se precisar cancelar.</small><b>Ver agendamento →</b></Link>}
      {notificacoes.length > 0 && <Link to="/cliente/historico" className="cliente-lembrete cliente-notificacao-interna"><span>🔔</span><strong>{notificacoes[0].message}</strong><small>Você tem {notificacoes.length} aviso(s) novo(s).</small><b>Ver avisos →</b></Link>}
      {!notificacoesPermitidas && typeof Notification !== "undefined" && Notification.permission !== "denied" && <button className="cliente-notificacao-botao" onClick={ativarNotificacoes}>Ativar lembretes neste navegador</button>}

      <section className="cliente-resumo">
        <div><span>Próximos atendimentos</span><strong>{loading ? "—" : agendamentos.filter((item) => item.status !== "cancelado").length}</strong></div>
        <div><span>Atendimento mais recente</span><strong>{loading ? "—" : agendamentos.length ? new Date(agendamentos[0].date).toLocaleDateString("pt-BR") : "Ainda não"}</strong></div>
        <div><span>Status da conta</span><strong className="cliente-verde">Ativa</strong></div>
      </section>

      <div className="cliente-secao-titulo">
        <div><span className="cliente-eyebrow">Atalhos</span><h2>O que você quer fazer?</h2></div>
        <span className="cliente-secao-detalhe">Acesse rapidamente os serviços da barbearia</span>
      </div>

      <div className="cliente-acoes">
        {opcoes.map((opcao) => (
          <Link to={opcao.rota} className="cliente-acao-card" key={opcao.rota}>
            <span className="cliente-acao-icone">{opcao.icone}</span>
            <span><strong>{opcao.nome}</strong><small>{opcao.desc}</small></span>
            <span className="cliente-acao-seta">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MenuCliente;
