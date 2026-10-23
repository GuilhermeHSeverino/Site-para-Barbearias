const formatarMoeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const rotulo = { color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "4px" };
const botaoTexto = { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px" };

// Um serviço do catálogo, com preço, duração e as ações de editar e excluir.
export default function CartaoServico({ servico, onEditar, onExcluir }) {
    return (
        <div
            style={{
                background: "#171717",
                border: "1px solid #2a2a2a",
                borderRadius: "16px",
                padding: "24px",
                transition: "0.2s",
                cursor: "default",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#22c55e";
                e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2a2a2a";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}
            >
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "white" }}>{servico.name}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={onEditar}
                        style={botaoTexto}
                        onMouseEnter={(e) => (e.target.style.color = "#22c55e")}
                        onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                    >
                        Editar
                    </button>
                    <button
                        onClick={onExcluir}
                        style={botaoTexto}
                        onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
                    >
                        Excluir
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "24px" }}>
                <div>
                    <span style={rotulo}>Preço</span>
                    <span style={{ color: "#22c55e", fontWeight: "700", fontSize: "18px" }}>
                        {formatarMoeda(parseFloat(servico.price))}
                    </span>
                </div>
                <div style={{ borderLeft: "1px solid #2a2a2a", paddingLeft: "24px" }}>
                    <span style={rotulo}>Duração</span>
                    <span style={{ color: "white", fontWeight: "600", fontSize: "18px" }}>{servico.duration}</span>
                </div>
            </div>
        </div>
    );
}
