import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";

export default function PerfilPublicoBarbeiro() {
    const [perfil, setPerfil] = useState(null);
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarPerfilPublico();
    }, []);

    const carregarPerfilPublico = async () => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            const barberId = token ? jwtDecode(token).barber_id : null;
            const [perfilRes, servicosRes] = await Promise.all([
                api.get("/api/v1/profile/update/"),
                api.get("/api/v1/services/", { params: { barber_id: barberId } }),
            ]);
            setPerfil(perfilRes.data);
            setServicos(servicosRes.data);
        } catch (error) {
            console.error("Erro ao carregar prévia pública:", error);
            setErro("Não foi possível carregar a prévia do perfil.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px" }}>Carregando prévia...</p>;
    if (erro) return <p style={{ color: "#f87171", textAlign: "center", padding: "40px" }}>{erro}</p>;

    const nome = perfil?.name || "Seu nome";
    return (
        <div style={{ width: "95%", maxWidth: "1000px", margin: "0 auto", padding: "32px 0 48px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "28px" }}>
                <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>← Voltar</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: "28px" }}>👤 Perfil público</h1>
                    <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: "14px" }}>Veja como seus clientes encontrarão suas informações.</p>
                </div>
            </div>

            <section style={{ background: "linear-gradient(135deg, #1b241f 0%, #171717 62%)", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "36px", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                <div style={{ width: "128px", height: "128px", borderRadius: "50%", background: "#2a2a2a", border: "4px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: "48px", fontWeight: "700" }}>
                    {nome[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: "240px" }}>
                    <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase" }}>Barbeiro profissional</span>
                    <h2 style={{ fontSize: "34px", margin: "8px 0", color: "white" }}>{nome}</h2>
                    <p style={{ color: "#d1d5db", lineHeight: 1.6, margin: "0 0 14px" }}>{perfil?.bio || "Adicione uma descrição sobre seu trabalho nas configurações do perfil."}</p>
                    {perfil?.specialties && <p style={{ color: "#9ca3af", margin: 0 }}><strong style={{ color: "white" }}>Especialidades:</strong> {perfil.specialties}</p>}
                </div>
            </section>

            <section style={{ marginTop: "24px", background: "#171717", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 18px", fontSize: "21px" }}>Serviços disponíveis</h2>
                {servicos.length === 0 ? (
                    <p style={{ color: "#9ca3af", margin: 0 }}>Cadastre serviços para que eles apareçam nesta prévia.</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                        {servicos.map((servico) => (
                            <div key={servico.id} style={{ background: "#121212", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                                <strong style={{ display: "block", marginBottom: "8px" }}>{servico.name}</strong>
                                <span style={{ color: "#22c55e", fontWeight: "700" }}>R$ {Number(servico.price).toFixed(2).replace(".", ",")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
