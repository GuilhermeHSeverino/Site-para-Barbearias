import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";
import CartaoServico from "./CartaoServico";
import ModalServico from "./ModalServico";

// Catálogo de serviços do barbeiro logado: lista, cadastro, edição e exclusão.
function ServicosBarbeiro() {
    const navigate = useNavigate();
    const [servicos, setServicos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    // undefined: modal fechado; null: novo serviço; objeto: serviço em edição
    const [servicoNoModal, setServicoNoModal] = useState(undefined);

    useEffect(() => {
        carregarServicos();
    }, []);

    const carregarServicos = async () => {
        setCarregando(true);
        try {
            const res = await api.get("/api/v1/services/");
            setServicos(res.data);
        } catch (err) {
            console.error("Erro ao carregar serviços:", err);
            alert(mensagemDeErro(err, "Não foi possível carregar os serviços."));
        } finally {
            setCarregando(false);
        }
    };

    const excluir = async (id) => {
        if (!window.confirm("Deseja realmente excluir este serviço?")) return;
        try {
            await api.delete(`/api/v1/services/${id}/`);
            carregarServicos();
        } catch (err) {
            // serviço com agendamentos no histórico: a API recusa e explica o motivo
            console.error("Erro ao excluir serviço:", err);
            alert(mensagemDeErro(err, "Não foi possível excluir o serviço."));
        }
    };

    return (
        <div style={{ width: "95%", maxWidth: "1400px", margin: "0 auto", padding: "40px 0", color: "white" }}>
            <div
                style={{
                    marginBottom: "32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <button
                        className="btn-voltar"
                        onClick={() => navigate("/barbeiro/")}
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
                            whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "white")}
                        onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                    >
                        ← Voltar
                    </button>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0, color: "white" }}>
                            Catálogo de Serviços ✂️
                        </h1>
                        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "4px 0 0 0" }}>
                            Gerencie seus serviços, preços e durações.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setServicoNoModal(null)}
                    style={{
                        backgroundColor: "#22c55e",
                        color: "#0d0d0d",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px 20px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "0.2s",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#16a34a")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#22c55e")}
                >
                    + Novo Serviço
                </button>
            </div>

            {carregando ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Carregando serviços...</p>
            ) : servicos.length === 0 ? (
                <div
                    style={{
                        backgroundColor: "#171717",
                        border: "1px solid #2a2a2a",
                        borderRadius: "16px",
                        padding: "40px",
                        textAlign: "center",
                        color: "#9ca3af",
                    }}
                >
                    <p>Nenhum serviço cadastrado.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "20px",
                    }}
                >
                    {servicos.map((s) => (
                        <CartaoServico
                            key={s.id}
                            servico={s}
                            onEditar={() => setServicoNoModal(s)}
                            onExcluir={() => excluir(s.id)}
                        />
                    ))}
                </div>
            )}

            {servicoNoModal !== undefined && (
                <ModalServico
                    servico={servicoNoModal}
                    onFechar={() => setServicoNoModal(undefined)}
                    onSalvo={() => {
                        setServicoNoModal(undefined);
                        carregarServicos();
                    }}
                />
            )}
        </div>
    );
}

export default ServicosBarbeiro;
