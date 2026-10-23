import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import CabecalhoCliente from "./CabecalhoCliente";
import ResumoCliente from "./ResumoCliente";
import DadosDoCliente from "./DadosDoCliente";
import NotasPrivadas from "./NotasPrivadas";
import HistoricoDeVisitas from "./HistoricoDeVisitas";

// Perfil de um cliente visto pelo barbeiro: dados, resumo, notas privadas e histórico de visitas.
function PerfilClienteBarbeiro() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregar = async () => {
            setCarregando(true);
            try {
                const [resCliente, resHistorico] = await Promise.all([
                    api.get(`/api/v1/client/${id}/`),
                    // só os atendimentos deste cliente com o barbeiro logado
                    api.get(`/api/v1/client-history/${id}/`),
                ]);
                setCliente(resCliente.data);
                setHistorico(resHistorico.data);
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, [id]);

    if (carregando) {
        return (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Carregando perfil do cliente...</p>
        );
    }
    if (!cliente) {
        return <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Cliente não encontrado.</p>;
    }

    return (
        <div style={{ width: "95%", maxWidth: "1400px", margin: "0 auto", padding: "32px 0 48px", color: "white" }}>
            <div
                style={{
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={() => navigate("/barbeiro/clientes")}
                    style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#9ca3af",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "13px",
                        transition: "0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "white")}
                    onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                >
                    ← Voltar para Clientes
                </button>
                <span style={{ color: "#6b7280", fontSize: "13px" }}>Perfil do cliente</span>
            </div>

            <CabecalhoCliente cliente={cliente} />
            <ResumoCliente historico={historico} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <DadosDoCliente cliente={cliente} />
                    <NotasPrivadas clienteId={parseInt(id)} />
                </div>
                <HistoricoDeVisitas historico={historico} />
            </div>
        </div>
    );
}

export default PerfilClienteBarbeiro;
