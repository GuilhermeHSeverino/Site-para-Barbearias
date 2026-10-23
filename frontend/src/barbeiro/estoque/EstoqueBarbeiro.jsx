import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";
import PedidosParaRetirada from "./PedidosParaRetirada";
import FormNovoProduto from "./FormNovoProduto";
import ResumoEstoque from "./ResumoEstoque";
import ListaDeProdutos from "./ListaDeProdutos";
import FormMovimentacao from "./FormMovimentacao";
import HistoricoMovimentacoes from "./HistoricoMovimentacoes";
import "./estoque.css";

// Estoque do barbeiro: carrega produtos, movimentações e pedidos e monta a tela com os componentes desta pasta.
export default function EstoqueBarbeiro() {
    const navigate = useNavigate();
    const [produtos, setProdutos] = useState([]);
    const [movimentos, setMovimentos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregandoProdutos, setCarregandoProdutos] = useState(true);
    const [carregandoMovimentos, setCarregandoMovimentos] = useState(true);
    const [erro, setErro] = useState("");
    const [formProdutoAberto, setFormProdutoAberto] = useState(false);
    // produto da movimentação aberta; null quando o formulário está fechado
    const [produtoMovimentado, setProdutoMovimentado] = useState(null);

    useEffect(() => {
        carregarProdutos();
        carregarMovimentos();
        carregarPedidos();
    }, []);

    const carregarProdutos = async () => {
        setCarregandoProdutos(true);
        try {
            const res = await api.get("/api/v1/stock/");
            setProdutos(res.data);
            setErro("");
        } catch (err) {
            console.error(err);
            setErro(mensagemDeErro(err, "Não foi possível carregar os produtos do estoque."));
        } finally {
            setCarregandoProdutos(false);
        }
    };

    const carregarMovimentos = async () => {
        setCarregandoMovimentos(true);
        try {
            const res = await api.get("/api/v1/stock-movements/");
            setMovimentos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregandoMovimentos(false);
        }
    };

    const carregarPedidos = async () => {
        try {
            const res = await api.get("/api/v1/stores/pending/");
            setPedidos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const confirmarEntrega = async (id, formaPagamento) => {
        try {
            await api.patch(`/api/v1/stores/${id}/confirm/`, { payment_method: formaPagamento });
            await carregarPedidos();
            await carregarProdutos();
            await carregarMovimentos();
        } catch (err) {
            alert(mensagemDeErro(err, "Não foi possível confirmar a entrega."));
        }
    };

    const produtosFiltrados = produtos.filter((p) => p.product_name?.toLowerCase().includes(busca.toLowerCase()));

    return (
        <div className="estoque-container">
            <div className="estoque-header">
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>
                        ← Voltar
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>📦 Gestão de Estoque</h1>
                        <p className="estoque-subtitle">Acompanhe produtos, movimentações e valor do seu estoque</p>
                    </div>
                </div>

                <div className="estoque-acoes">
                    <input
                        type="text"
                        className="busca-input"
                        placeholder="Buscar produto..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                    <button className="btn-novo-produto" onClick={() => setFormProdutoAberto(!formProdutoAberto)}>
                        {formProdutoAberto ? "Fechar" : "+ Adicionar produto ao estoque"}
                    </button>
                </div>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <PedidosParaRetirada pedidos={pedidos} onConfirmar={confirmarEntrega} />

            {formProdutoAberto && (
                <FormNovoProduto
                    onSalvo={() => {
                        setFormProdutoAberto(false);
                        carregarProdutos();
                    }}
                />
            )}

            <ResumoEstoque produtos={produtos} />

            <div className={`painel-principal ${produtoMovimentado !== null ? "" : "sem-lateral"}`}>
                <ListaDeProdutos
                    produtos={produtosFiltrados}
                    carregando={carregandoProdutos}
                    busca={busca}
                    onMovimentar={(produtoId) => setProdutoMovimentado(produtoId)}
                />

                {produtoMovimentado !== null && (
                    <FormMovimentacao
                        key={produtoMovimentado}
                        produtos={produtos}
                        produtoInicial={produtoMovimentado}
                        onFechar={() => setProdutoMovimentado(null)}
                        onSalvo={() => {
                            setProdutoMovimentado(null);
                            carregarProdutos();
                            carregarMovimentos();
                        }}
                    />
                )}
            </div>

            <HistoricoMovimentacoes movimentos={movimentos} carregando={carregandoMovimentos} />
        </div>
    );
}
