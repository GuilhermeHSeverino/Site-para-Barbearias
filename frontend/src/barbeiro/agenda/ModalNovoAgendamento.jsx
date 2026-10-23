import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";
import { HORARIOS, formatarData } from "./agendaUtils";

// cliente cadastrado na hora, pelo barbeiro, sem e-mail: recebe um e-mail interno e uma senha aleatória
const gerarEmailFallback = (phone) => `cliente${phone.replace(/\D/g, "")}@barbearia.local`;
const gerarSenhaAleatoria = () => Math.random().toString(36).slice(-10) + "Aa1!";

// Lança um atendimento para um cliente (já cadastrado ou cadastrado na hora) ou bloqueia um intervalo de horários.
export default function ModalNovoAgendamento({ diaSelecionado, clientes, servicos, barberId, onFechar, onSalvo }) {
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
    const [erro, setErro] = useState("");

    const clientesFiltrados = clientes.filter((c) => {
        const termo = buscaCliente.toLowerCase();
        return c.name?.toLowerCase().includes(termo) || c.phone?.toLowerCase().includes(termo);
    });

    const criarClienteRapido = async () => {
        if (!novoCliente.name || !novoCliente.phone) {
            setErro("Preencha nome e telefone do cliente.");
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
            setErro(mensagemDeErro(err, "Erro ao cadastrar cliente."));
            return null;
        }
    };

    const confirmar = async () => {
        setErro("");

        let cliente = clienteSelecionado;
        if (criandoCliente) {
            cliente = await criarClienteRapido();
            if (!cliente) return;
        }

        if (!isBloqueio && !cliente) {
            setErro("Selecione ou cadastre um cliente.");
            return;
        }
        if (!servicoSelecionado && !isBloqueio) {
            setErro("Selecione um serviço.");
            return;
        }
        if (isBloqueio) {
            if (!horaInicio || !horaFim) {
                setErro("Selecione o horário de início e fim do bloqueio.");
                return;
            }
        } else if (!horaSelecionada) {
            setErro("Selecione um horário.");
            return;
        }

        setSalvando(true);
        try {
            if (isBloqueio) {
                const inicioIdx = HORARIOS.indexOf(horaInicio);
                const fimIdx = HORARIOS.indexOf(horaFim);
                if (inicioIdx === -1 || fimIdx === -1 || inicioIdx > fimIdx) {
                    setErro("Horário de início deve ser menor ou igual ao de fim.");
                    return;
                }
                // cada horário de 30 minutos do intervalo vira um bloqueio
                await Promise.all(
                    HORARIOS.slice(inicioIdx, fimIdx + 1).map((hora) =>
                        api.post("/api/v1/schedule/", {
                            barber: barberId,
                            client_name: null,
                            service: null,
                            date: diaSelecionado,
                            start_time: hora,
                            status: "bloqueado",
                        }),
                    ),
                );
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
            onSalvo();
        } catch (err) {
            console.error(err);
            setErro(mensagemDeErro(err, "Erro ao criar agendamento."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onFechar}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {isBloqueio ? "Bloquear Horário" : "Novo agendamento"}
                    </h2>
                    <button className="modal-fechar" onClick={onFechar}>
                        ✕
                    </button>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "20px",
                        padding: "10px",
                        backgroundColor: "#121212",
                        borderRadius: "8px",
                        border: "1px solid #2a2a2a",
                    }}
                >
                    <input
                        type="checkbox"
                        id="bloqueio"
                        checked={isBloqueio}
                        onChange={(e) => setIsBloqueio(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <label
                        htmlFor="bloqueio"
                        style={{ color: "white", fontSize: "14px", cursor: "pointer", userSelect: "none" }}
                    >
                        Bloquear este horário (Uso Pessoal)
                    </label>
                </div>

                <p className="modal-data-info">
                    Data: <strong>{formatarData(diaSelecionado)}</strong>
                </p>

                {erro && <div className="modal-erro">{erro}</div>}

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

                        <button className="link-cadastrar-cliente" onClick={() => setCriandoCliente(true)}>
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

                        <button className="link-cadastrar-cliente" onClick={() => setCriandoCliente(false)}>
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
                        <SeletorDeHorario valor={horaInicio} onChange={setHoraInicio} vazio="Selecione o início" />

                        <label className="modal-label">Horário de Fim</label>
                        <SeletorDeHorario valor={horaFim} onChange={setHoraFim} vazio="Selecione o fim" />
                    </>
                ) : (
                    <>
                        <label className="modal-label">Horário</label>
                        <SeletorDeHorario
                            valor={horaSelecionada}
                            onChange={setHoraSelecionada}
                            vazio="Selecione o horário"
                        />
                    </>
                )}

                <button className="modal-confirmar" onClick={confirmar} disabled={salvando}>
                    {salvando ? "Agendando..." : "Confirmar agendamento"}
                </button>
            </div>
        </div>
    );
}

function SeletorDeHorario({ valor, onChange, vazio }) {
    return (
        <select className="modal-input" value={valor} onChange={(e) => onChange(e.target.value)}>
            <option value="">{vazio}</option>
            {HORARIOS.map((h) => (
                <option key={h} value={h}>
                    {h}
                </option>
            ))}
        </select>
    );
}
