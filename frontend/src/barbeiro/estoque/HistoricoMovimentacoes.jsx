import { useState } from "react";

// Últimas entradas e saídas do estoque, com a opção de ver o histórico inteiro.
export default function HistoricoMovimentacoes({ movimentos, carregando }) {
    const [completo, setCompleto] = useState(false);

    return (
        <div className="historico-card">
            <h2>Histórico de movimentações</h2>

            {carregando ? (
                <p className="estado-msg">Carregando histórico...</p>
            ) : movimentos.length === 0 ? (
                <p className="estado-msg">Nenhuma movimentação registrada ainda.</p>
            ) : (
                <div className="lista">
                    {(completo ? movimentos : movimentos.slice(0, 8)).map((m) => (
                        <div key={m.id} className="item">
                            <div>
                                <strong>{m.product_name}</strong>
                                <p>{m.description || "Sem descrição"}</p>
                            </div>
                            <div>
                                <p>Qtd: {m.quantity}</p>
                            </div>
                            <div>
                                <span className={`status ${m.type === "entrada" ? "green" : "red"}`}>
                                    {m.type === "entrada" ? "Entrada" : "Saída"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {movimentos.length > 8 && (
                <button className="btn-ver-mais" onClick={() => setCompleto(!completo)}>
                    {completo ? "Mostrar só as mais recentes" : `Ver histórico completo (${movimentos.length})`}
                </button>
            )}
        </div>
    );
}
