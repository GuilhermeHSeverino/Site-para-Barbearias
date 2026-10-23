import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";

const campo = {
    backgroundColor: "#121212",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "12px",
    color: "white",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
};
const rotulo = { color: "#9ca3af", fontSize: "14px" };

// Cadastro ou edição de um serviço. A duração alimenta o cálculo dos horários livres.
// servico = null para cadastrar um novo
export default function ModalServico({ servico, onFechar, onSalvo }) {
    const [dados, setDados] = useState(
        servico
            ? { name: servico.name, price: servico.price, duration: servico.duration }
            : { name: "", price: "", duration: "00:30:00" },
    );

    const salvar = async (e) => {
        e.preventDefault();
        try {
            if (servico) {
                await api.put(`/api/v1/services/${servico.id}/`, dados);
            } else {
                await api.post("/api/v1/services/", dados);
            }
            onSalvo();
        } catch (err) {
            console.error("Erro ao salvar serviço:", err);
            alert(mensagemDeErro(err, "Não foi possível salvar o serviço. Confira o preço e a duração (HH:MM:SS)."));
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                style={{
                    backgroundColor: "#171717",
                    border: "1px solid #2a2a2a",
                    borderRadius: "20px",
                    width: "90%",
                    maxWidth: "450px",
                    padding: "32px",
                    color: "white",
                }}
            >
                <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "24px", textAlign: "center" }}>
                    {servico ? "Editar Serviço" : "Novo Serviço"}
                </h2>

                <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={rotulo}>Nome do Serviço</label>
                        <input
                            type="text"
                            required
                            value={dados.name}
                            onChange={(e) => setDados({ ...dados, name: e.target.value })}
                            style={campo}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={rotulo}>Preço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={dados.price}
                                onChange={(e) => setDados({ ...dados, price: e.target.value })}
                                style={campo}
                            />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={rotulo}>Duração (HH:MM:SS)</label>
                            <input
                                type="text"
                                required
                                value={dados.duration}
                                onChange={(e) => setDados({ ...dados, duration: e.target.value })}
                                style={campo}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                        <button
                            type="button"
                            onClick={onFechar}
                            style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                border: "1px solid #2a2a2a",
                                color: "#9ca3af",
                                padding: "12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "0.2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.color = "white")}
                            onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                backgroundColor: "#22c55e",
                                border: "none",
                                color: "white",
                                padding: "12px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "0.2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = "#16a34a")}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = "#22c55e")}
                        >
                            {servico ? "Salvar" : "Criar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
