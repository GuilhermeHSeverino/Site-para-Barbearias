import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function NotificacoesBarbeiro() {
    const [notificacoes, setNotificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarNotificacoes();
    }, []);

    const carregarNotificacoes = async () => {
        try {
            const res = await api.get("/api/v1/notifications/");
            setNotificacoes(res.data);
        } catch (error) {
            console.error("Erro ao carregar notificações:", error);
            setErro("Não foi possível carregar as notificações.");
        } finally {
            setLoading(false);
        }
    };

    const marcarComoLida = async (id) => {
        try {
            await api.patch(`/api/v1/notifications/${id}/`);
            setNotificacoes((atuais) => atuais.map((notificacao) => (
                notificacao.id === id ? { ...notificacao, is_read: true } : notificacao
            )));
        } catch (error) {
            console.error("Erro ao marcar notificação:", error);
        }
    };

    return (
        <div style={{ width: "95%", maxWidth: "900px", margin: "0 auto", padding: "32px 0 48px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "28px" }}>
                <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>← Voltar</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: "28px" }}>🔔 Notificações</h1>
                    <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: "14px" }}>Acompanhe alertas importantes da sua barbearia.</p>
                </div>
            </div>

            {erro && <p style={{ color: "#f87171" }}>{erro}</p>}
            {loading ? (
                <p style={{ color: "#9ca3af" }}>Carregando notificações...</p>
            ) : notificacoes.length === 0 ? (
                <div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    Nenhuma notificação por enquanto.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notificacoes.map((notificacao) => (
                        <button
                            key={notificacao.id}
                            onClick={() => !notificacao.is_read && marcarComoLida(notificacao.id)}
                            style={{ display: "flex", alignItems: "flex-start", gap: "14px", width: "100%", textAlign: "left", background: notificacao.is_read ? "#171717" : "#1d2a21", border: `1px solid ${notificacao.is_read ? "#2a2a2a" : "#28613d"}`, borderRadius: "14px", padding: "18px", color: "white", cursor: notificacao.is_read ? "default" : "pointer" }}
                        >
                            <span style={{ fontSize: "20px" }}>{notificacao.type === "STOCK_LOW" ? "📦" : "ℹ️"}</span>
                            <span style={{ flex: 1 }}>
                                <strong style={{ display: "block", marginBottom: "6px" }}>{notificacao.message}</strong>
                                <small style={{ color: "#9ca3af" }}>{new Date(notificacao.created_at).toLocaleString("pt-BR")}</small>
                            </span>
                            {!notificacao.is_read && <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: "700" }}>NOVA</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
