
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";

/**
 * Componente para Gestão de Clientes do Barbeiro (CRM).
 * Exibe a lista de clientes que já visitaram este barbeiro.
 */
function ClientesBarbeiro() {
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem(ACCESS_TOKEN);

            if (!token) {
                throw new Error("Usuário não autenticado");
            }

            const decoded = jwtDecode(token);
            const email = decoded.email;

            // 1. Buscar o ID do barbeiro através do email
            const resBarber = await api.get("/api/v1/barber/", {
                params: { email },
            });

            if (!resBarber.data || resBarber.data.length === 0) {
                throw new Error("Perfil de barbeiro não encontrado");
            }

            const barberId = resBarber.data[0].id;

            // 2. Buscar clientes vinculados a este barbeiro
            const resClients = await api.get("/api/v1/client/", {
                params: { barber_id: barberId },
            });

            setClientes(resClients.data);
        } catch (err) {
            console.error("Erro ao carregar clientes:", err);
            alert("Erro ao carregar a lista de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const clientesFiltrados = clientes.filter((cliente) => {
        const termo = busca.trim().toLowerCase();
        return !termo || [cliente.name, cliente.email, cliente.phone]
            .filter(Boolean)
            .some((valor) => valor.toLowerCase().includes(termo));
    });

    return (
        <div
            style={{
                width: "95%",
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "40px 0",
                color: "white",
            }}
        >
            {/* HEADER - Padrão Premium */}
            <div
                style={{
                    marginBottom: "32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <button
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#9ca3af";
                        }}
                    >
                        ← Voltar
                    </button>

                    <div>
                        <h1
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                margin: 0,
                                color: "white",
                            }}
                        >
                            Meus Clientes 👥
                        </h1>

                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "14px",
                                margin: "4px 0 0 0",
                            }}
                        >
                            Gerencie a base de clientes que já passaram pela sua
                            cadeira.
                        </p>
                    </div>
                </div>
            </div>

            {!loading && clientes.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <input
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, telefone ou e-mail"
                        aria-label="Buscar clientes"
                        style={{ flex: "1 1 280px", maxWidth: "520px", background: "#171717", border: "1px solid #2a2a2a", borderRadius: "10px", color: "white", padding: "12px 14px", outline: "none" }}
                    />
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        {clientesFiltrados.length} de {clientes.length} cliente(s)
                    </span>
                </div>
            )}

            {loading ? (
                <p
                    style={{
                        color: "#9ca3af",
                        textAlign: "center",
                        padding: "40px 0",
                    }}
                >
                    Carregando clientes...
                </p>
            ) : clientes.length === 0 ? (
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
                    <p>
                        Você ainda não possui clientes registrados no sistema.
                    </p>
                </div>
            ) : clientesFiltrados.length === 0 ? (
                <div style={{ backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    <p>Nenhum cliente encontrado para essa busca.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
                        gap: "20px",
                    }}
                >
                    {clientesFiltrados.map((cliente) => (
                        <div
                            key={cliente.id}
                            onClick={() =>
                                navigate(
                                    `/barbeiro/clientes/${cliente.id}`
                                )
                            }
                            style={{
                                background: "#171717",
                                border: "1px solid #2a2a2a",
                                borderRadius: "16px",
                                padding: "24px",
                                transition: "0.2s",
                                cursor: "pointer",
                                position: "relative",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#22c55e";
                                e.currentTarget.style.transform =
                                    "translateY(-3px)";
                                e.currentTarget.style.boxShadow =
                                    "0 10px 20px rgba(0,0,0,0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#2a2a2a";
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "50%",
                                        backgroundColor: "#2a2a2a",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "20px",
                                        fontWeight: "700",
                                        color: "#22c55e",
                                        border: "2px solid #22c55e",
                                    }}
                                >
                                    {cliente.name
                                        ? cliente.name[0].toUpperCase()
                                        : "?"}
                                </div>

                                <div>
                                    <h3
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: "600",
                                            margin: 0,
                                            color: "white",
                                        }}
                                    >
                                        {cliente.name}
                                    </h3>

                                    <span
                                        style={{
                                            color: "#9ca3af",
                                            fontSize: "13px",
                                        }}
                                    >
                                        Cliente
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#9ca3af",
                                        fontSize: "14px",
                                    }}
                                >
                                    <span>📞</span>
                                    {cliente.phone}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#9ca3af",
                                        fontSize: "14px",
                                    }}
                                >
                                    <span>✉️</span>
                                    {cliente.email}
                                </div>
                            </div>

                            <div
                                style={{
                                    marginTop: "20px",
                                    textAlign: "right",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#22c55e",
                                }}
                            >
                                Ver Perfil →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ClientesBarbeiro;

