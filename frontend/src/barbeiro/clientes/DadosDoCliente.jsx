// Cartão com o nome, o telefone e o e-mail do cliente.
export default function DadosDoCliente({ cliente }) {
    const nome = cliente.name || "Cliente";
    const linha = { display: "flex", alignItems: "center", gap: "12px", color: "#9ca3af", fontSize: "14px" };
    return (
        <div
            style={{
                background: "#171717",
                border: "1px solid #2a2a2a",
                borderRadius: "20px",
                padding: "32px",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    fontWeight: "700",
                    color: "#22c55e",
                    border: "4px solid #22c55e",
                    margin: "0 auto 20px",
                }}
            >
                {nome[0].toUpperCase()}
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0", color: "white" }}>{nome}</h2>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px" }}>Cliente Fiel</p>

            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={linha}>
                    <span>📞</span> {cliente.phone || "Telefone não informado"}
                </div>
                <div style={linha}>
                    <span>✉️</span> {cliente.email || "E-mail não informado"}
                </div>
            </div>
        </div>
    );
}
