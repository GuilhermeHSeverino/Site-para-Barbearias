// Clientes aguardando vaga com este barbeiro (avisados automaticamente quando um horário é cancelado).
export default function ListaDeEspera({ itens }) {
    if (itens.length === 0) return null;
    return (
        <div className="agenda-timeline-card" style={{ marginTop: "20px" }}>
            <h2 style={{ color: "white", fontSize: "19px", margin: "0 0 14px" }}>Lista de espera</h2>
            <div className="lista-sugestoes">
                {itens.map((item) => (
                    <div className="sugestao-item" key={item.id}>
                        <strong>{item.client}</strong>
                        <span>
                            {item.service} · {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
