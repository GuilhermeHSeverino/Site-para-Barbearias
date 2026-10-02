import { useEffect, useState } from "react";
import ProdutoLojaCard from "./ProdutoLojaCard";
import {
    criarPedidoDeProduto,
    listarBarbeirosParaRetirada,
    listarProdutosDisponiveis,
} from "../../services/cliente/lojaService";
import "./clienteFlow.css";

export default function LojaCliente() {
    const [produtos, setProdutos] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [barbeiro, setBarbeiro] = useState("");
    const [quantidades, setQuantidades] = useState({});
    const [loading, setLoading] = useState(true);
    const [comprando, setComprando] = useState(null);
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        listarProdutosDisponiveis()
            .then(setProdutos)
            .catch((error) => console.error("Erro ao carregar loja:", error))
            .finally(() => setLoading(false));
        listarBarbeirosParaRetirada()
            .then(setBarbeiros)
            .catch((error) => console.error("Erro ao carregar barbeiros:", error));
    }, []);

    const atualizarQuantidade = (produtoId, valor) => {
        setQuantidades((atuais) => ({ ...atuais, [produtoId]: valor }));
    };

    const comprar = async (produto) => {
        const quantidade = Number(quantidades[produto.product] || 1);
        setComprando(produto.product);
        setMensagem("");
        try {
            if (!barbeiro) {
                setMensagem("Escolha o barbeiro onde você fará a retirada.");
                return;
            }
            await criarPedidoDeProduto({
                product: produto.product,
                quantity: quantidade,
                barber: barbeiro,
            });
            setMensagem("Pedido enviado. O estoque será atualizado quando o barbeiro confirmar a entrega.");
        } catch (error) {
            setMensagem(error.response?.data?.detail || "Não foi possível concluir a compra.");
        } finally {
            setComprando(null);
        }
    };

    return (
        <div className="cliente-fluxo cliente-loja">
            <div className="cliente-fluxo-cabecalho">
                <div><h2>Loja da barbearia</h2><p>Produtos disponíveis para você levar seu cuidado para casa.</p></div>
                <span className="cliente-nota">Estoque em tempo real</span>
            </div>
            {mensagem && <div className="cliente-fluxo-vazio" style={{ marginBottom: "16px", color: mensagem.includes("Pedido enviado") ? "#4ade80" : "#f87171" }}>{mensagem}</div>}
            <div className="cliente-loja-retirada"><label className="cliente-fluxo-label" htmlFor="loja-barbeiro">Onde você fará a retirada?</label><select id="loja-barbeiro" className="cliente-fluxo-input" value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)}><option value="">Selecione o barbeiro</option>{barbeiros.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small className="cliente-nota">O pedido aguardará a confirmação da entrega pelo barbeiro e o pagamento será feito na retirada.</small></div>
            {loading ? <p className="cliente-nota">Carregando produtos...</p> : produtos.length === 0 ? <div className="cliente-fluxo-vazio">Nenhum produto disponível no momento.</div> : <div className="cliente-loja-grid">
                {produtos.map((produto) => (
                    <ProdutoLojaCard
                        key={produto.product}
                        produto={produto}
                        quantidade={quantidades[produto.product] || 1}
                        comprando={comprando}
                        onQuantidadeChange={atualizarQuantidade}
                        onComprar={comprar}
                    />
                ))}
            </div>}
        </div>
    );
}
