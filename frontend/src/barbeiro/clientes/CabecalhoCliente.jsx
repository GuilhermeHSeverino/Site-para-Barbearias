// Nome do cliente com atalhos para ligar e mandar e-mail.
export default function CabecalhoCliente({ cliente }) {
    const nome = cliente.name || "Cliente";
    return (
        <div
            style={{
                background: "linear-gradient(135deg, #1b241f 0%, #171717 58%)",
                border: "1px solid #2a2a2a",
                borderRadius: "20px",
                padding: "28px 32px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <div
                    style={{
                        width: "76px",
                        height: "76px",
                        borderRadius: "50%",
                        backgroundColor: "#2a2a2a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "30px",
                        fontWeight: "700",
                        color: "#22c55e",
                        border: "3px solid #22c55e",
                    }}
                >
                    {nome[0].toUpperCase()}
                </div>
                <div>
                    <p
                        style={{
                            color: "#22c55e",
                            fontSize: "12px",
                            fontWeight: "700",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            margin: "0 0 6px",
                        }}
                    >
                        Relacionamento
                    </p>
                    <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0, color: "white" }}>{nome}</h2>
                    <p style={{ color: "#9ca3af", fontSize: "14px", margin: "6px 0 0" }}>
                        Acompanhe preferências e histórico em um só lugar.
                    </p>
                </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {cliente.phone && (
                    <a
                        href={`tel:${cliente.phone}`}
                        style={{
                            background: "#22c55e",
                            color: "#07130b",
                            textDecoration: "none",
                            borderRadius: "9px",
                            padding: "10px 14px",
                            fontSize: "13px",
                            fontWeight: "700",
                        }}
                    >
                        📞 Ligar
                    </a>
                )}
                {cliente.email && (
                    <a
                        href={`mailto:${cliente.email}`}
                        style={{
                            background: "#252a27",
                            color: "white",
                            textDecoration: "none",
                            border: "1px solid #3b453f",
                            borderRadius: "9px",
                            padding: "10px 14px",
                            fontSize: "13px",
                            fontWeight: "600",
                        }}
                    >
                        ✉️ E-mail
                    </a>
                )}
            </div>
        </div>
    );
}
