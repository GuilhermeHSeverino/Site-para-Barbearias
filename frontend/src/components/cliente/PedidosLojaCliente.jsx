import { useEffect, useState } from "react";
import api from "../../api";
import "./clienteFlow.css";

const STATUS = { pendente: "Aguardando entrega", entregue: "Entregue", cancelado: "Cancelado" };

export default function PedidosLojaCliente() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelando, setCancelando] = useState(null);

    useEffect(() => {
        api.get("/api/v1/stores/my-orders/")
            .then((res) => setPedidos(res.data))
            .catch((error) => console.error("Erro ao carregar pedidos da loja:", error))
            .finally(() => setLoading(false));
    }, []);

    const cancelarPedido = async (id) => {
        if (!window.confirm("Deseja cancelar este pedido?")) return;
        setCancelando(id);
        try {
            await api.patch(`/api/v1/stores/${id}/cancel/`);
            setPedidos((atuais) => atuais.map((pedido) => pedido.id === id ? { ...pedido, status: "cancelado" } : pedido));
        } catch (error) {
            window.alert(error.response?.data?.detail || "Não foi possível cancelar o pedido.");
        } finally {
            setCancelando(null);
        }
    };

    return (
        <div className="cliente-fluxo">
            <div className="cliente-fluxo-card">
                <div className="cliente-fluxo-cabecalho">
                    <div><h2>Meus pedidos da loja</h2><p>Acompanhe solicitações, forma de pagamento e entrega.</p></div>
                </div>
                {loading ? <p className="cliente-nota">Carregando pedidos...</p> : pedidos.length === 0 ? <div className="cliente-fluxo-vazio">Você ainda não solicitou nenhum produto.</div> : <div className="cliente-agendamento-lista">{pedidos.map((pedido) => <div className="cliente-agendamento-item" key={pedido.id}><div className="cliente-agendamento-topo"><div><h3>{pedido.product} · {pedido.quantity} un.</h3><p>Retirada com {pedido.barber}</p></div><span className={`cliente-status ${pedido.status}`}>{STATUS[pedido.status] || pedido.status}</span></div><p>Valor: R$ {pedido.total.toFixed(2).replace(".", ",")} · Pagamento na retirada</p><p>Solicitado em {new Date(`${pedido.created_at}T12:00:00`).toLocaleDateString("pt-BR")}</p>{pedido.status === "pendente" && <button className="cliente-avaliar cliente-cancelar" onClick={() => cancelarPedido(pedido.id)} disabled={cancelando === pedido.id}>{cancelando === pedido.id ? "Cancelando..." : "Cancelar pedido"}</button>}</div>)}</div>}
            </div>
        </div>
    );
}
