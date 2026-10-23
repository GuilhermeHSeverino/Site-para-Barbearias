import { useState } from "react";
import MostrarMais from "../../componentes-comuns/MostrarMais";
import { PAGAMENTOS } from "../../utils/pagamentos";

// Pedidos da loja reservados com este barbeiro; ao confirmar a entrega, a API baixa o estoque e lança a receita.
export default function PedidosParaRetirada({ pedidos, onConfirmar }) {
    const [pagamentoPedido, setPagamentoPedido] = useState({});
    const [visiveis, setVisiveis] = useState(5);

    if (pedidos.length === 0) return null;
    return (
        <div className="movimento-card" style={{ marginBottom: "24px" }}>
            <h2>Pedidos aguardando retirada</h2>
            <div className="lista">
                {pedidos.slice(0, visiveis).map((pedido) => (
                    <div className="pedido-item" key={pedido.id}>
                        <div>
                            <strong>{pedido.product}</strong>
                            <p>
                                {pedido.client} · Quantidade: {pedido.quantity}
                            </p>
                        </div>
                        <div className="pedido-acoes">
                            <select
                                className="pedido-pagamento"
                                aria-label="Forma de pagamento"
                                value={pagamentoPedido[pedido.id] || "dinheiro"}
                                onChange={(e) =>
                                    setPagamentoPedido({ ...pagamentoPedido, [pedido.id]: e.target.value })
                                }
                            >
                                {PAGAMENTOS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn-confirmar-mov"
                                onClick={() => onConfirmar(pedido.id, pagamentoPedido[pedido.id] || "dinheiro")}
                            >
                                Confirmar entrega
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <MostrarMais total={pedidos.length} visiveis={visiveis} passo={5} onMostrar={setVisiveis} />
        </div>
    );
}
