import { formatarData } from "./historicoUtils";

// Cartões com o total de visitas, os atendimentos concluídos e a última visita do cliente com este barbeiro.
export default function ResumoCliente({ historico }) {
    const concluidos = historico.filter((item) => item.status === "concluido").length;
    const ultimaVisita = historico[0]; // a API devolve o histórico do mais recente para o mais antigo

    const cartoes = [
        ["Visitas registradas", historico.length, "Total de atendimentos"],
        ["Atendimentos concluídos", concluidos, "Histórico confirmado"],
        [
            "Última visita",
            ultimaVisita ? formatarData(ultimaVisita.date) : "Ainda não",
            ultimaVisita ? ultimaVisita.service : "Sem agendamentos",
        ],
    ];

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
            }}
        >
            {cartoes.map(([rotulo, valor, detalhe]) => (
                <div
                    key={rotulo}
                    style={{
                        background: "#171717",
                        border: "1px solid #2a2a2a",
                        borderRadius: "14px",
                        padding: "18px 20px",
                    }}
                >
                    <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 10px" }}>{rotulo}</p>
                    <strong style={{ display: "block", color: "white", fontSize: "22px", marginBottom: "4px" }}>
                        {valor}
                    </strong>
                    <span style={{ color: "#6b7280", fontSize: "12px" }}>{detalhe}</span>
                </div>
            ))}
        </div>
    );
}
