import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import { mensagemDeErro } from "../../utils/mensagemErro";
import { dataLocal } from "./agendaUtils";
import SeletorDeDias from "./SeletorDeDias";
import LinhaDoTempo from "./LinhaDoTempo";
import ListaDeEspera from "./ListaDeEspera";
import ModalNovoAgendamento from "./ModalNovoAgendamento";
import ModalAcaoAgendamento from "./ModalAcaoAgendamento";
import ModalFolgas from "./ModalFolgas";
import "./agenda.css";

// Agenda do barbeiro: carrega os dados da semana e monta a tela com os componentes desta pasta.
function AgendaBarbeiro() {
    const navigate = useNavigate();
    const [agendamentos, setAgendamentos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [listaEspera, setListaEspera] = useState([]);
    const [folgas, setFolgas] = useState([]);
    const [diaSelecionado, setDiaSelecionado] = useState(dataLocal());
    const [carregando, setCarregando] = useState(true);

    const [novoAgendamentoAberto, setNovoAgendamentoAberto] = useState(false);
    const [folgasAberto, setFolgasAberto] = useState(false);
    const [acaoAgendamento, setAcaoAgendamento] = useState(null); // { id, tipo: "concluir" | "cancelar" | "desbloquear" }

    const barberId = (() => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            return token ? jwtDecode(token).barber_id : null;
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        setCarregando(true);
        try {
            const fimSemana = new Date();
            fimSemana.setDate(fimSemana.getDate() + 6);
            const [agRes, servRes, cliRes, esperaRes, folgasRes] = await Promise.all([
                // só os 7 dias exibidos na agenda, não o histórico inteiro
                api.get("/api/v1/schedule/", { params: { data_inicio: dataLocal(), data_fim: dataLocal(fimSemana) } }),
                api.get("/api/v1/services/"),
                api.get("/api/v1/client/"),
                api.get("/api/v1/schedule/waitlist/pending/"),
                api.get("/api/v1/schedule/vacations/"),
            ]);
            setAgendamentos(agRes.data);
            setServicos(servRes.data);
            setClientes(cliRes.data);
            setListaEspera(esperaRes.data);
            setFolgas(folgasRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    };

    const proximosDias = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return dataLocal(d);
    });

    const folgaDoDia = (dia) => folgas.find((f) => f.start_date <= dia && dia <= f.end_date);

    const agendamentoNoHorario = (hora) =>
        agendamentos.find(
            (ag) => ag.date === diaSelecionado && ag.start_time.slice(0, 5) === hora && ag.status !== "cancelado",
        );

    const removerFolga = async (id) => {
        if (!window.confirm("Remover este bloqueio? Os dias voltarão a ficar disponíveis para agendamento.")) return;
        try {
            await api.delete(`/api/v1/schedule/vacations/${id}/`);
            await carregarTudo();
        } catch (err) {
            alert(mensagemDeErro(err, "Não foi possível remover o bloqueio."));
        }
    };

    return (
        <div className="agenda-container">
            <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "20px" }}>
                <button
                    className="btn-voltar"
                    onClick={() => navigate("/barbeiro/")}
                    style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#9ca3af",
                        padding: "10px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "white")}
                    onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                >
                    ← Voltar
                </button>
                <div>
                    <h1 style={{ fontSize: "30px", fontWeight: "700", margin: 0, color: "white" }}>
                        Agenda de Atendimentos 📅
                    </h1>
                    <p style={{ color: "#9ca3af", fontSize: "15px", margin: "4px 0 0 0" }}>
                        Gerencie seus horários e clientes.
                    </p>
                </div>
            </div>

            <SeletorDeDias
                dias={proximosDias}
                diaSelecionado={diaSelecionado}
                onSelecionar={setDiaSelecionado}
                folgaDoDia={folgaDoDia}
                onAbrirFolgas={() => setFolgasAberto(true)}
                onNovoAgendamento={() => setNovoAgendamentoAberto(true)}
            />

            {folgaDoDia(diaSelecionado) && (
                <div className="aviso-folga">
                    <span>Dia bloqueado como folga/férias: os clientes não conseguem agendar.</span>
                    <button onClick={() => removerFolga(folgaDoDia(diaSelecionado).id)}>Remover bloqueio</button>
                </div>
            )}

            <LinhaDoTempo
                carregando={carregando}
                agendamentoNoHorario={agendamentoNoHorario}
                onConcluir={(id) => setAcaoAgendamento({ id, tipo: "concluir" })}
                onCancelar={(id) => setAcaoAgendamento({ id, tipo: "cancelar" })}
                onDesbloquear={(id) => setAcaoAgendamento({ id, tipo: "desbloquear" })}
            />

            <ListaDeEspera itens={listaEspera} />

            {folgasAberto && (
                <ModalFolgas
                    diaSelecionado={diaSelecionado}
                    folgas={folgas}
                    onFechar={() => setFolgasAberto(false)}
                    onAlterado={carregarTudo}
                    onRemover={removerFolga}
                />
            )}

            {novoAgendamentoAberto && (
                <ModalNovoAgendamento
                    diaSelecionado={diaSelecionado}
                    clientes={clientes}
                    servicos={servicos}
                    barberId={barberId}
                    onFechar={() => setNovoAgendamentoAberto(false)}
                    onSalvo={() => {
                        setNovoAgendamentoAberto(false);
                        carregarTudo();
                    }}
                />
            )}

            {acaoAgendamento && (
                <ModalAcaoAgendamento
                    acao={acaoAgendamento}
                    onFechar={() => setAcaoAgendamento(null)}
                    onConcluida={() => {
                        setAcaoAgendamento(null);
                        carregarTudo();
                    }}
                />
            )}
        </div>
    );
}

export default AgendaBarbeiro;
