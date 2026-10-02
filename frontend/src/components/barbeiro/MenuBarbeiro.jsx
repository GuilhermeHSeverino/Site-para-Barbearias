import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import "./menuBarbeiro.css";

function MenuBarbeiro() {
    const [loading, setLoading] = useState(true);
    const [agendaHoje, setAgendaHoje] = useState([]);
    const [ganhosHoje, setGanhosHoje] = useState(0);
    const [faturamentoMes, setFaturamentoMes] = useState(0);
    const [lucroLiquidoMes, setLucroLiquidoMes] = useState(0);
    const [estoqueBaixo, setEstoqueBaixo] = useState(0);
    useEffect(() => {
        carregarResumo();
    }, []);

    const carregarResumo = async () => {
        const hoje = new Date().toISOString().split("T")[0];

        const [schedRes, financeMesRes, financeDiaRes, stockAlertsRes] =
            await Promise.allSettled([
                api.get("/api/v1/schedule/"),
                api.get("/api/v1/finance-summary/?periodo=mensal"),
                api.get("/api/v1/finance-summary/?periodo=diario"),
                api.get("/api/v1/stock-alerts/"),
            ]);

        if (schedRes.status === "fulfilled") {
            const doDia = schedRes.value.data
                .filter((s) => s.date === hoje)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
            setAgendaHoje(doDia);
        }

        if (financeMesRes.status === "fulfilled") {
            setFaturamentoMes(financeMesRes.value.data.total_entradas);
            setLucroLiquidoMes(financeMesRes.value.data.lucro_liquido);
        }

        if (financeDiaRes.status === "fulfilled") {
            setGanhosHoje(financeDiaRes.value.data.total_entradas);
        }

        if (stockAlertsRes.status === "fulfilled") {
            setEstoqueBaixo(stockAlertsRes.value.data.length);
        }

        setLoading(false);
    };

    const formatarMoeda = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const statusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case "concluido":
                return { label: "Concluído", classe: "badge-verde" };
            case "cancelado":
                return { label: "Cancelado", classe: "badge-vermelho" };
            case "bloqueado":
                return { label: "Bloqueado", classe: "badge-amarelo" };
            default:
                return { label: "Agendado", classe: "badge-amarelo" };
        }
    };

    const opcoes = [
        { nome: "Agenda", desc: "Veja e gerencie seus agendamentos do dia", icone: "📅", rota: "/barbeiro/agenda" },
        { nome: "Serviços", desc: "Gerencie seus serviços e preços", icone: "✂️", rota: "/barbeiro/servicos" },
        { nome: "Estoque", desc: "Controle produtos e movimentações", icone: "📦", rota: "/barbeiro/estoque" },
        { nome: "Financeiro", desc: "Acompanhe faturamento e saldo", icone: "💰", rota: "/barbeiro/financas" },
        { nome: "Feedbacks", desc: "Veja as avaliações dos clientes", icone: "⭐", rota: "/barbeiro/feedbacks" },
        { nome: "Configurações", desc: "Ajuste seu perfil e horários", icone: "⚙️", rota: "/barbeiro/configuracoes" },
    ];

    return (
        <div className="menu-barbeiro-container">

            <div className="menu-barbeiro-header">
                <h1>Bem-vindo de volta 👋</h1>
                <p>Aqui está um resumo rápido do seu dia</p>
            </div>

            {/* RESUMO */}
            <div className="home-stats">
                <div className="home-stat-card">
                    <span>Agendamentos hoje</span>
                    <h2>{loading ? "—" : agendaHoje.length}</h2>
                </div>

                <div className="home-stat-card">
                    <span>Ganhos de hoje</span>
                    <h2 className="home-verde">{loading ? "—" : formatarMoeda(ganhosHoje)}</h2>
                </div>

                <div className="home-stat-card">
                    <span>Faturamento do mês</span>
                    <h2>{loading ? "—" : formatarMoeda(faturamentoMes)}</h2>
                </div>

                <div className="home-stat-card">
                    <span>Lucro Líquido (mês)</span>
                    <h2 className={lucroLiquidoMes < 0 ? "home-vermelho" : "home-verde"}>
                        {loading ? "—" : formatarMoeda(lucroLiquidoMes)}
                    </h2>
                </div>

                <div className="home-stat-card">
                    <span>Estoque baixo</span>
                    <h2 className={estoqueBaixo > 0 ? "home-vermelho" : ""}>
                        {loading ? "—" : estoqueBaixo}
                    </h2>
                </div>
            </div>

            {/* AGENDA DE HOJE */}
            <div className="agenda-hoje-card">
                <div className="agenda-hoje-header">
                    <h2>Agenda de hoje</h2>
                    <Link to="/barbeiro/agenda" className="agenda-hoje-link">
                        Ver agenda completa →
                    </Link>
                </div>

                {loading ? (
                    <p className="estado-msg">Carregando agenda...</p>
                ) : agendaHoje.length === 0 ? (
                    <p className="estado-msg">Nenhum agendamento para hoje.</p>
                ) : (
                    <div className="agenda-hoje-lista">
                        {agendaHoje.map((ag) => {
                            const info = statusInfo(ag.status);
                            return (
                                <div key={ag.id} className="agenda-hoje-item">
                                    <span className="agenda-hoje-hora">
                                        {ag.start_time?.slice(0, 5)}
                                    </span>

                                    <div className="agenda-hoje-info">
                                        <strong>{ag.client_name_display}</strong>
                                        <p>{ag.service_name}</p>
                                    </div>

                                    <span className={`agenda-hoje-badge ${info.classe}`}>
                                        {info.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ATALHOS */}
            <h2 className="menu-barbeiro-subtitulo">Acesso rápido</h2>

            <div className="menu-barbeiro-grid">
                {opcoes.map((opcao) => (
                    <Link key={opcao.rota} to={opcao.rota} className="menu-barbeiro-card">
                        <span className="menu-barbeiro-icone">{opcao.icone}</span>
                        <div>
                            <h3>{opcao.nome}</h3>
                            <p>{opcao.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default MenuBarbeiro;