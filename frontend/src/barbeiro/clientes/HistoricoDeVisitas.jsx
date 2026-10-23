import { NOMES_STATUS, formatarData } from "./historicoUtils";

// Atendimentos do cliente com o barbeiro logado e o serviço que ele mais faz.
export default function HistoricoDeVisitas({ historico }) {
    const contagem = historico.reduce((acc, item) => {
        acc[item.service] = (acc[item.service] || 0) + 1;
        return acc;
    }, {});
    const servicoMaisRealizado = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];

    return (
        <div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "32px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h3 style={{ fontSize: "22px", fontWeight: "700", margin: 0, color: "white" }}>
                        Histórico de Visitas 📅
                    </h3>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: "6px 0 0" }}>
                        {servicoMaisRealizado
                            ? `Serviço mais realizado: ${servicoMaisRealizado[0]}`
                            : "As visitas do cliente aparecerão aqui."}
                    </p>
                </div>
                <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>
                    {historico.length} registro(s)
                </span>
            </div>

            {historico.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
                    <p>Este cliente ainda não possui histórico de visitas.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {historico.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                backgroundColor: "#121212",
                                border: "1px solid #2a2a2a",
                                borderRadius: "12px",
                                padding: "16px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ color: "white", fontWeight: "600", fontSize: "16px" }}>
                                    {item.service}
                                </span>
                                <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                                    {formatarData(item.date)} às {item.start_time.slice(0, 5)}
                                </span>
                            </div>
                            <span
                                style={{
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    backgroundColor: item.status === "concluido" ? "#065f46" : "#3f3f46",
                                    color: item.status === "concluido" ? "#34d399" : "#d1d5db",
                                }}
                            >
                                {NOMES_STATUS[item.status] || item.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
