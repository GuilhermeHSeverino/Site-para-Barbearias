import { useEffect, useState } from "react";
import api from "../../api";
import "./clienteFlow.css";
import { mensagemDeErro } from "../../utils/mensagemErro";
import { avisarNotificacoesAtualizadas } from "../../hooks/useNotificacoesAoVivo";

export default function NotificacoesCliente() {
    const [notificacoes, setNotificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        api.get("/api/v1/client-notifications/")
            .then((res) => setNotificacoes(res.data))
            .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar as notificações.")))
            .finally(() => setLoading(false));
    }, []);

    const marcarComoLida = async (id) => {
        try {
            await api.patch(`/api/v1/client-notifications/${id}/`);
            setNotificacoes((atuais) => atuais.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
            avisarNotificacoesAtualizadas();
        } catch (error) {
            console.error("Erro ao marcar notificação:", error);
        }
    };

    const marcarTodas = async () => {
        try {
            await api.post("/api/v1/client-notifications/read-all/");
            setNotificacoes((atuais) => atuais.map((item) => ({ ...item, is_read: true })));
            avisarNotificacoesAtualizadas();
        } catch (error) {
            setErro(mensagemDeErro(error, "Não foi possível marcar as notificações como lidas."));
        }
    };

    const naoLidas = notificacoes.filter((item) => !item.is_read).length;

    return (
        <div className="cliente-fluxo">
            <div className="cliente-fluxo-card">
                <div className="cliente-fluxo-cabecalho">
                    <div>
                        <h2>Seus avisos</h2>
                        <p>Lembretes de horário e avisos da barbearia. Toque em um aviso para marcá-lo como lido.</p>
                    </div>
                    {naoLidas > 0 && (
                        <button className="cliente-fluxo-botao" onClick={marcarTodas}>
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
                {erro && (
                    <p className="cliente-nota" style={{ color: "#f87171" }}>
                        {erro}
                    </p>
                )}
                {loading ? (
                    <p className="cliente-nota">Carregando notificações...</p>
                ) : notificacoes.length === 0 ? (
                    <div className="cliente-fluxo-vazio">Nenhuma notificação por enquanto.</div>
                ) : (
                    <div className="cliente-agendamento-lista">
                        {notificacoes.map((item) => (
                            <button
                                key={item.id}
                                className={`cliente-notificacao-item ${item.is_read ? "" : "nova"}`}
                                onClick={() => !item.is_read && marcarComoLida(item.id)}
                            >
                                <span>
                                    <strong>{item.message}</strong>
                                    <small>
                                        {new Date(item.created_at).toLocaleString("pt-BR", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </small>
                                </span>
                                {!item.is_read && <span className="cliente-status concluido">Nova</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
