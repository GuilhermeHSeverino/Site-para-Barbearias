import { useEffect, useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";

// Nota que só o barbeiro logado vê sobre o cliente (preferências, cortes anteriores etc.).
export default function NotasPrivadas({ clienteId }) {
    const [nota, setNota] = useState("");
    const [notaId, setNotaId] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        // a API devolve só as notas do barbeiro logado
        api.get("/api/v1/barber-notes/")
            .then((res) => {
                const notaDoCliente = res.data.find((n) => n.client === clienteId);
                setNotaId(notaDoCliente ? notaDoCliente.id : null);
                setNota(notaDoCliente ? notaDoCliente.note : "");
            })
            .catch((err) => console.error("Erro ao carregar a nota:", err));
    }, [clienteId]);

    const salvar = async () => {
        setSalvando(true);
        try {
            if (notaId) {
                await api.put(`/api/v1/barber-notes/${notaId}/`, { note: nota });
            } else {
                // o barbeiro da nota é definido pela API a partir do login
                const res = await api.post("/api/v1/barber-notes/create/", { client: clienteId, note: nota });
                setNotaId(res.data.id);
            }
            setMensagem("Nota salva com sucesso.");
        } catch (err) {
            console.error("Erro ao salvar nota:", err);
            setMensagem(mensagemDeErro(err, "Não foi possível salvar a nota."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "white" }}>
                Notas Privadas 📝
            </h3>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 16px" }}>
                Registre preferências, cortes e detalhes importantes para o próximo atendimento.
            </p>
            <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Anote preferências do cliente, cortes anteriores, etc..."
                style={{
                    width: "100%",
                    height: "150px",
                    backgroundColor: "#121212",
                    border: "1px solid #2a2a2a",
                    borderRadius: "12px",
                    padding: "12px",
                    color: "white",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                }}
            />
            <button
                onClick={salvar}
                disabled={salvando}
                style={{
                    width: "100%",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontWeight: "600",
                    cursor: salvando ? "not-allowed" : "pointer",
                    transition: "0.2s",
                }}
            >
                {salvando ? "Salvando..." : "Salvar Nota"}
            </button>
            {mensagem && (
                <p
                    style={{
                        color: mensagem.includes("sucesso") ? "#4ade80" : "#f87171",
                        fontSize: "12px",
                        margin: "12px 0 0",
                        textAlign: "center",
                    }}
                >
                    {mensagem}
                </p>
            )}
        </div>
    );
}
