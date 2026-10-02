import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import "./agenda.css";

const PAGAMENTOS = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "pix", label: "Pix" },
];

function gerarHorarios() {
    const horarios = [];
    for (let h = 8; h <= 20; h++) {
        horarios.push(`${String(h).padStart(2, "0")}:00`);
        horarios.push(`${String(h).padStart(2, "0")}:30`);
    }
    return horarios;
}

const HORARIOS = gerarHorarios();

function AgendaBarbeiro() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [listaEspera, setListaEspera] = useState([]);
    const [diaSelecionado, setDiaSelecionado] = useState("");
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();

    // modal de novo agendamento
    const [modalAberto, setModalAberto] = useState(false);
    const [feriasModalAberto, setFeriasModalAberto] = useState(false);
    const [mesFerias, setMesFerias] = useState(() => {
        const hoje = new Date();
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    });
    const [salvandoFerias, setSalvandoFerias] = useState(false);
    const [isBloqueio, setIsBloqueio] = useState(false);
    const [buscaCliente, setBuscaCliente] = useState("");
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [criandoCliente, setCriandoCliente] = useState(false);
    const [novoCliente, setNovoCliente] = useState({ name: "", phone: "", email: "" });
    const [servicoSelecionado, setServicoSelecionado] = useState("");
    const [horaSelecionada, setHoraSelecionada] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [erroModal, setErroModal] = useState("");

    // ação sobre um agendamento (concluir / cancelar / desbloquear)
    const [acaoAgendamento, setAcaoAgendamento] = useState(null); // { id, tipo: 'concluir' | 'cancelar' | 'desbloquear' }
    const [formaPagamento, setFormaPagamento] = useState("dinheiro");


    const barberId = (() => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            return token ? jwtDecode(token).barber_id : null;
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        const hoje = new Date().toISOString().split("T")[0];
        setDiaSelecionado(hoje);
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        setCarregando(true);
        try {
            const [agRes, servRes, cliRes, esperaRes] = await Promise.all([
                api.get("/api/v1/schedule/"),
                api.get("/api/v1/services/"),
                api.get("/api/v1/client/"),
                api.get("/api/v1/schedule/waitlist/pending/"),
            ]);
            setAgendamentos(agRes.data);
            setServicos(servRes.data);
            setClientes(cliRes.data);
            setListaEspera(esperaRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    };

    const getStatusInfo = (status) => {
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

    const getAgendamentoPorHorario = (hora) => {
        return agendamentos.find(
            (ag) =>
                ag.date === diaSelecionado &&
                ag.start_time.slice(0, 5) === hora &&
                ag.status !== "cancelado"
        );
    };

    const proximosDias = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });

    // ===== AÇÕES SOBRE AGENDAMENTO EXISTENTE =====

    const abrirConcluir = (id) => {
        setAcaoAgendamento({ id, tipo: "concluir" });
        setFormaPagamento("dinheiro");
    };

    const abrirCancelar = (id) => {
        setAcaoAgendamento({ id, tipo: "cancelar" });
    };

    const abrirDesbloquear = (id) => {
        setAcaoAgendamento({ id, tipo: "desbloquear" });
    };

    const confirmarAcao = async () => {
        if (!acaoAgendamento) return;

        try {
            if (acaoAgendamento.tipo === "concluir") {
                await api.patch(`/api/v1/schedule/${acaoAgendamento.id}/`, {
                    status: "concluido",
                    payment_method: formaPagamento,
                });
            } else if (acaoAgendamento.tipo === "cancelar") {
                await api.patch(`/api/v1/schedule/${acaoAgendamento.id}/`, {
                    status: "cancelado",
                });
            } else if (acaoAgendamento.tipo === "desbloquear") {
                await api.delete(`/api/v1/schedule/${acaoAgendamento.id}/`);
            }
            setAcaoAgendamento(null);
            carregarTudo();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Erro ao atualizar agendamento.");
        }
    };

    // ===== NOVO AGENDAMENTO =====

    const abrirModal = () => {
        setModalAberto(true);
        setIsBloqueio(false);
        setBuscaCliente("");
        setClienteSelecionado(null);
        setCriandoCliente(false);
        setNovoCliente({ name: "", phone: "", email: "" });
        setServicoSelecionado("");
        setHoraSelecionada("");
        setHoraInicio("");
        setHoraFim("");
        setErroModal("");
    };

    const bloquearMesFerias = async () => {
        if (!mesFerias) return;
        setSalvandoFerias(true);
        try {
            await api.post("/api/v1/schedule/vacations/", { month: mesFerias });
            setFeriasModalAberto(false);
            alert("Mês bloqueado como férias. Os clientes não poderão agendar nesse período.");
        } catch (err) {
            alert(err.response?.data?.detail || "Não foi possível bloquear o mês.");
        } finally {
            setSalvandoFerias(false);
        }
    };

    const clientesFiltrados = clientes.filter((c) => {
        const termo = buscaCliente.toLowerCase();
        return (
            c.name?.toLowerCase().includes(termo) ||
            c.phone?.toLowerCase().includes(termo)
        );
    });

    const gerarEmailFallback = (phone) =>
        `cliente${phone.replace(/\D/g, "")}@barbearia.local`;

    const gerarSenhaAleatoria = () =>
        Math.random().toString(36).slice(-10) + "Aa1!";

    const criarClienteRapido = async () => {
        if (!novoCliente.name || !novoCliente.phone) {
            setErroModal("Preencha nome e telefone do cliente.");
            return null;
        }

        try {
            const res = await api.post("/api/v1/client/", {
                name: novoCliente.name,
                phone: novoCliente.phone,
                email: novoCliente.email || gerarEmailFallback(novoCliente.phone),
                password: gerarSenhaAleatoria(),
            });
            return res.data;
        } catch (err) {
            console.error(err);
            setErroModal(
                err.response?.data?.email?.[0] ||
                err.response?.data?.detail ||
                "Erro ao cadastrar cliente."
            );
            return null;
        }
    };

    const confirmarNovoAgendamento = async () => {
        setErroModal("");

        let cliente = clienteSelecionado;

        if (criandoCliente) {
            cliente = await criarClienteRapido();
            if (!cliente) return;
        }

        if (!isBloqueio && !cliente) {
            setErroModal("Selecione ou cadastre um cliente.");
            return;
        }

        if (!servicoSelecionado && !isBloqueio) {
            setErroModal("Selecione um serviço.");
            return;
        }

        if (isBloqueio) {
            if (!horaInicio || !horaFim) {
                setErroModal("Selecione o horário de início e fim do bloqueio.");
                return;
            }
        } else if (!horaSelecionada) {
            setErroModal("Selecione um horário.");
            return;
        }

        setSalvando(true);
        try {
            if (isBloqueio) {
                const startIdx = HORARIOS.indexOf(horaInicio);
                const endIdx = HORARIOS.indexOf(horaFim);

                if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
                    setErroModal("Horário de início deve ser menor ou igual ao de fim.");
                    setSalvando(false);
                    return;
                }

                const slotsToBlock = HORARIOS.slice(startIdx, endIdx + 1);

                await Promise.all(slotsToBlock.map(hora =>
                    api.post("/api/v1/schedule/", {
                        barber: barberId,
                        client_name: null,
                        service: null,
                        date: diaSelecionado,
                        start_time: hora,
                        status: "bloqueado",
                    })
                ));
            } else {
                await api.post("/api/v1/schedule/", {
                    barber: barberId,
                    client_name: cliente ? cliente.id : null,
                    service: servicoSelecionado || null,
                    date: diaSelecionado,
                    start_time: horaSelecionada,
                    status: "agendado",
                });
            }

            setModalAberto(false);
            carregarTudo();
        } catch (err) {
            console.error(err);
            setErroModal(
                err.response?.data?.non_field_errors?.[0] ||
                err.response?.data?.detail ||
                "Erro ao criar agendamento."
            );
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="agenda-container">
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    onClick={() => navigate("/barbeiro/")}
                    style={{
                        background: 'none',
                        border: '1px solid #2a2a2a',
                        color: '#9ca3af',
                        padding: '10px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                    ← Voltar
                </button>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'white' }}>
                        Agenda de Atendimentos 📅
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '15px', margin: '4px 0 0 0' }}>
                        Gerencie seus horários e clientes.
                    </p>
                </div>
            </div>

            {/* DIAS */}
            <div className="agenda-topo">
                <div className="agenda-controles">
                    <div className="agenda-dias">
                        {proximosDias.map((dia) => (
                            <button
                                key={dia}
                                onClick={() => setDiaSelecionado(dia)}
                                className={`dia-pill ${dia === diaSelecionado ? "ativo" : ""}`}
                            >
                                {dia.split("-").reverse().join("/")}
                            </button>
                        ))}
                    </div>
                    <div className="agenda-acoes-topo">
                        <button className="btn-ferias" onClick={() => setFeriasModalAberto(true)}>
                            Bloquear férias
                        </button>
                        <button className="btn-novo-agendamento" onClick={abrirModal}>
                            + Novo Agendamento
                        </button>
                    </div>
                </div>
            </div>

            {/* TIMELINE */}
            <div className="agenda-timeline-card">
                {carregando ? (
                    <p className="estado-msg">Carregando agenda...</p>
                ) : (
                    <div className="agenda-timeline">
                        {HORARIOS.map((hora) => {
                            const ag = getAgendamentoPorHorario(hora);
                            const info = ag ? getStatusInfo(ag.status) : null;

                            return (
                                <div key={hora} className="agenda-linha">
                                    <span className="agenda-hora">{hora}</span>

                                    {ag ? (
                                        <div className="agenda-slot preenchido">
                                            <div className="agenda-slot-info">
                                                <strong>{ag.client_name_display}</strong>
                                                <p>{ag.service_name}</p>
                                            </div>

                                            <span className={`agenda-badge ${info.classe}`}>
                                                {info.label}
                                            </span>

                                            {ag.status === "agendado" && (
                                                <div className="agenda-slot-acoes">
                                                    <button
                                                        className="acao-concluir"
                                                        onClick={() => abrirConcluir(ag.id)}
                                                    >
                                                        Concluir
                                                    </button>
                                                    <button
                                                        className="acao-cancelar"
                                                        onClick={() => abrirCancelar(ag.id)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            )}
                                            {ag.status === "bloqueado" && (
                                                <div className="agenda-slot-acoes">
                                                    <button
                                                        className="acao-cancelar"
                                                        onClick={() => abrirDesbloquear(ag.id)}
                                                    >
                                                        Desbloquear
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="agenda-slot vazio" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {listaEspera.length > 0 && <div className="agenda-timeline-card" style={{ marginTop: "20px" }}>
                <h2 style={{ color: "white", fontSize: "19px", margin: "0 0 14px" }}>Lista de espera</h2>
                <div className="lista-sugestoes">{listaEspera.map((item) => <div className="sugestao-item" key={item.id}><strong>{item.client}</strong><span>{item.service} · {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}</span></div>)}</div>
            </div>}

            {feriasModalAberto && (
                <div className="modal-backdrop" onClick={() => setFeriasModalAberto(false)}>
                    <div className="modal-card pequeno" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bloquear mês de férias</h2>
                            <button className="modal-fechar" onClick={() => setFeriasModalAberto(false)}>✕</button>
                        </div>
                        <p className="modal-data-info">Todos os dias do mês ficarão indisponíveis para novos agendamentos.</p>
                        <label className="modal-label" htmlFor="mes-ferias">Mês das férias</label>
                        <input id="mes-ferias" className="modal-input" type="month" value={mesFerias} onChange={(e) => setMesFerias(e.target.value)} />
                        <button className="modal-confirmar" onClick={bloquearMesFerias} disabled={salvandoFerias}>{salvandoFerias ? "Bloqueando..." : "Confirmar férias"}</button>
                    </div>
                </div>
            )}

            {/* MODAL: NOVO AGENDAMENTO */}
            {modalAberto && (
                <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isBloqueio ? "Bloquear Horário" : "Novo agendamento"}
                            </h2>
                            <button className="modal-fechar" onClick={() => setModalAberto(false)}>✕</button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '10px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                            <input
                                type="checkbox"
                                id="bloqueio"
                                checked={isBloqueio}
                                onChange={(e) => setIsBloqueio(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="bloqueio" style={{ color: 'white', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                                Bloquear este horário (Uso Pessoal)
                            </label>
                        </div>

                        <p className="modal-data-info">
                            Data: <strong>{diaSelecionado.split("-").reverse().join("/")}</strong>
                        </p>

                        {erroModal && <div className="modal-erro">{erroModal}</div>}

                        {!criandoCliente ? (
                            <>
                                <label className="modal-label">Cliente</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    placeholder="Buscar por nome ou telefone..."
                                    value={buscaCliente}
                                    onChange={(e) => {
                                        setBuscaCliente(e.target.value);
                                        setClienteSelecionado(null);
                                    }}
                                />

                                {buscaCliente && !clienteSelecionado && (
                                    <div className="lista-sugestoes">
                                        {clientesFiltrados.length === 0 ? (
                                            <p className="sem-resultado">Nenhum cliente encontrado.</p>
                                        ) : (
                                            clientesFiltrados.slice(0, 6).map((c) => (
                                                <button
                                                    key={c.id}
                                                    className="sugestao-item"
                                                    onClick={() => {
                                                        setClienteSelecionado(c);
                                                        setBuscaCliente(`${c.name} — ${c.phone}`);
                                                    }}
                                                >
                                                    <strong>{c.name}</strong>
                                                    <span>{c.phone}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                <button
                                    className="link-cadastrar-cliente"
                                    onClick={() => setCriandoCliente(true)}
                                >
                                    + Cadastrar novo cliente
                                </button>
                            </>
                        ) : (
                            <>
                                <label className="modal-label">Nome do cliente</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    value={novoCliente.name}
                                    onChange={(e) => setNovoCliente({ ...novoCliente, name: e.target.value })}
                                />

                                <label className="modal-label">Telefone</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    value={novoCliente.phone}
                                    onChange={(e) => setNovoCliente({ ...novoCliente, phone: e.target.value })}
                                />

                                <label className="modal-label">E-mail (opcional)</label>
                                <input
                                    type="email"
                                    className="modal-input"
                                    value={novoCliente.email}
                                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                                />

                                <button
                                    className="link-cadastrar-cliente"
                                    onClick={() => setCriandoCliente(false)}
                                >
                                    ← Buscar cliente já cadastrado
                                </button>
                            </>
                        )}

                        <label className="modal-label">Serviço</label>
                        <select
                            className="modal-input"
                            value={servicoSelecionado}
                            onChange={(e) => setServicoSelecionado(e.target.value)}
                        >
                            <option value="">Selecione o serviço</option>
                            {servicos.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} — R$ {s.price}
                                </option>
                            ))}
                        </select>

                        {isBloqueio ? (
                            <>
                                <label className="modal-label">Horário de Início</label>
                                <select
                                    className="modal-input"
                                    value={horaInicio}
                                    onChange={(e) => setHoraInicio(e.target.value)}
                                >
                                    <option value="">Selecione o início</option>
                                    {HORARIOS.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>

                                <label className="modal-label">Horário de Fim</label>
                                <select
                                    className="modal-input"
                                    value={horaFim}
                                    onChange={(e) => setHoraFim(e.target.value)}
                                >
                                    <option value="">Selecione o fim</option>
                                    {HORARIOS.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <>
                                <label className="modal-label">Horário</label>
                                <select
                                    className="modal-input"
                                    value={horaSelecionada}
                                    onChange={(e) => setHoraSelecionada(e.target.value)}
                                >
                                    <option value="">Selecione o horário</option>
                                    {HORARIOS.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        <button
                            className="modal-confirmar"
                            onClick={confirmarNovoAgendamento}
                            disabled={salvando}
                        >
                            {salvando ? "Agendando..." : "Confirmar agendamento"}
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: CONCLUIR / CANCELAR */}
            {acaoAgendamento && (
                <div className="modal-backdrop" onClick={() => setAcaoAgendamento(null)}>
                    <div className="modal-card pequeno" onClick={(e) => e.stopPropagation()}>
                        {acaoAgendamento.tipo === "concluir" ? (
                            <>
                                <h2>Concluir atendimento</h2>
                                <label className="modal-label">Forma de pagamento</label>
                                <select
                                    className="modal-input"
                                    value={formaPagamento}
                                    onChange={(e) => setFormaPagamento(e.target.value)}
                                >
                                    {PAGAMENTOS.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>

                                <button className="modal-confirmar" onClick={confirmarAcao}>
                                    Confirmar conclusão
                                </button>
                            </>
                        ) : acaoAgendamento.tipo === "desbloquear" ? (
                            <>
                                <h2>Desbloquear horário?</h2>
                                <p className="modal-data-info">Este horário voltará a ficar disponível para agendamentos.</p>
                                <button className="modal-confirmar perigo" onClick={confirmarAcao}>
                                    Confirmar desbloqueio
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>Cancelar agendamento?</h2>
                                <p className="modal-data-info">Essa ação não pode ser desfeita.</p>
                                <button className="modal-confirmar perigo" onClick={confirmarAcao}>
                                    Confirmar cancelamento
                                </button>
                            </>
                        )}

                        <button
                            className="btn-voltar"
                            onClick={() => setAcaoAgendamento(null)}
                        >
                            ← Voltar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AgendaBarbeiro;