import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import "./estoque.css";

export default function EstoqueBarbeiro() {
    const [produtos, setProdutos] = useState([]);
    const [movimentos, setMovimentos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState("");
    const navigate = useNavigate();

    const [loadingProdutos, setLoadingProdutos] = useState(true);
    const [loadingMovimentos, setLoadingMovimentos] = useState(true);
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [adicionandoProduto, setAdicionandoProduto] = useState(false);
    const [novoProduto, setNovoProduto] = useState({ name: "", description: "", price: "", estoque_minimo: 5, quantity: 0, disponivel_na_loja: false });

    const [movimento, setMovimento] = useState({
        product: "",
        type: "entrada",
        quantity: 1,
        description: ""
    });

    const token = localStorage.getItem(ACCESS_TOKEN);
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        carregarProdutos();
        carregarMovimentos();
        carregarPedidos();
    }, []);

    const carregarProdutos = async () => {
        setLoadingProdutos(true);
        try {
            const res = await api.get("/api/v1/stock/", config);
            setProdutos(res.data);
            setErro("");
        } catch (err) {
            console.error(err);
            setErro("Não foi possível carregar os produtos do estoque.");
        } finally {
            setLoadingProdutos(false);
        }
    };

    const carregarMovimentos = async () => {
        setLoadingMovimentos(true);
        try {
            const res = await api.get("/api/v1/stock-movements/", config);
            setMovimentos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMovimentos(false);
        }
    };

    const carregarPedidos = async () => {
        try {
            const res = await api.get("/api/v1/stores/pending/", config);
            setPedidos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const confirmarEntrega = async (id) => {
        try {
            await api.patch(`/api/v1/stores/${id}/confirm/`, { payment_method: "pix" }, config);
            await carregarPedidos();
            await carregarProdutos();
            await carregarMovimentos();
        } catch (err) {
            alert(err.response?.data?.detail || "Não foi possível confirmar a entrega.");
        }
    };

    const enviarMovimento = async () => {
        if (!movimento.product) return alert("Selecione um produto");

        setEnviando(true);
        try {
            await api.post("/api/v1/stock-movements/", movimento, config);

            setMovimento({
                product: "",
                type: "entrada",
                quantity: 1,
                description: ""
            });

            await carregarProdutos();
            await carregarMovimentos();
        } catch (err) {
            console.error(err);
            alert(
                err.response?.data?.quantity?.[0] ||
                err.response?.data?.detail ||
                "Erro ao registrar movimentação."
            );
        } finally {
            setEnviando(false);
        }
    };

    const produtosFiltrados = produtos.filter((p) =>
        p.product_name?.toLowerCase().includes(busca.toLowerCase())
    );

    const adicionarProduto = async () => {
        if (!novoProduto.name || !novoProduto.price) return alert("Informe nome e preço do produto.");
        setAdicionandoProduto(true);
        try {
            await api.post("/api/v1/products/", {
                name: novoProduto.name,
                description: novoProduto.description,
                price: novoProduto.price,
                estoque_minimo: novoProduto.estoque_minimo,
                initial_quantity: novoProduto.quantity,
                disponivel_na_loja: novoProduto.disponivel_na_loja,
            }, config);
            setNovoProduto({ name: "", description: "", price: "", estoque_minimo: 5, quantity: 0, disponivel_na_loja: false });
            await carregarProdutos();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Não foi possível adicionar o produto.");
        } finally {
            setAdicionandoProduto(false);
        }
    };

    const totalProdutos = produtos.length;

    const valorTotal = produtos.reduce((acc, p) => {
        const preco = parseFloat(p.product_price) || 0;
        return acc + p.quantity * preco;
    }, 0);

    const estoqueBaixo = produtos.filter(
        (p) => p.quantity <= (p.product_estoque_minimo ?? 5)
    ).length;

    const itensArmazenados = produtos.reduce((a, p) => a + p.quantity, 0);

    return (
        <div className="estoque-container">

            {/* HEADER */}
            <div className="estoque-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>
                        ← Voltar
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>📦 Gestão de Estoque</h1>
                        <p className="estoque-subtitle">
                            Acompanhe produtos, movimentações e valor do seu estoque
                        </p>
                    </div>
                </div>

                <input
                    type="text"
                    className="busca-input"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            {pedidos.length > 0 && <div className="movimento-card" style={{ marginBottom: "24px" }}>
                <h2>Pedidos aguardando retirada</h2>
                <div className="lista">{pedidos.map((pedido) => <div className="item" key={pedido.id}><div><strong>{pedido.product}</strong><p>{pedido.client} · Quantidade: {pedido.quantity}</p></div><button className="btn-confirmar-mov" onClick={() => confirmarEntrega(pedido.id)}>Confirmar entrega</button></div>)}</div>
            </div>}

            <div className="movimento-card" style={{ marginBottom: "24px" }}>
                <h2>Adicionar item à loja</h2>
                <div className="movimento-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    <div className="campo-grupo"><label>Nome</label><input value={novoProduto.name} onChange={(e) => setNovoProduto({ ...novoProduto, name: e.target.value })} placeholder="Ex: Pomada modeladora" /></div>
                    <div className="campo-grupo"><label>Descrição</label><input value={novoProduto.description} onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })} placeholder="Descrição do produto" /></div>
                    <div className="campo-grupo"><label>Preço (R$)</label><input type="number" min="0" step="0.01" value={novoProduto.price} onChange={(e) => setNovoProduto({ ...novoProduto, price: e.target.value })} /></div>
                    <div className="campo-grupo"><label>Quantidade inicial</label><input type="number" min="0" value={novoProduto.quantity} onChange={(e) => setNovoProduto({ ...novoProduto, quantity: e.target.value })} /></div>
                    <label className="campo-grupo" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}><input type="checkbox" checked={novoProduto.disponivel_na_loja} onChange={(e) => setNovoProduto({ ...novoProduto, disponivel_na_loja: e.target.checked })} /> Disponível na loja</label>
                    <button className="btn-confirmar-mov" onClick={adicionarProduto} disabled={adicionandoProduto}>{adicionandoProduto ? "Adicionando..." : "Adicionar produto"}</button>
                </div>
            </div>

            {/* CARDS */}
            <div className="cards-dashboard">

                <div className="dashboard-card">
                    <span>Produtos</span>
                    <h2>{totalProdutos}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Valor em estoque</span>
                    <h2>R$ {valorTotal.toFixed(2)}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Estoque baixo</span>
                    <h2>{estoqueBaixo}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Itens armazenados</span>
                    <h2>{itensArmazenados}</h2>
                </div>

            </div>

            {/* PAINEL PRINCIPAL: PRODUTOS + MOVIMENTAÇÃO */}
            <div className="painel-principal">

                {/* PRODUTOS */}
                <div className="produtos-card">
                    <h2>Produtos</h2>

                    {loadingProdutos ? (
                        <p className="estado-msg">Carregando produtos...</p>
                    ) : produtosFiltrados.length === 0 ? (
                        <p className="estado-msg">
                            {busca ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado."}
                        </p>
                    ) : (
                        <div className="lista">
                            {produtosFiltrados.map((p) => (
                                <div key={p.id} className="item">
                                    <div>
                                        <strong>{p.product_name}</strong>
                                        <p>R$ {parseFloat(p.product_price || 0).toFixed(2)}</p>
                                    </div>

                                    <div>
                                        <p>Qtd: {p.quantity}</p>
                                    </div>

                                    <div>
                                        {p.quantity <= (p.product_estoque_minimo ?? 5) ? (
                                            <span className="status red">Baixo</span>
                                        ) : (
                                            <span className="status green">OK</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* NOVA MOVIMENTAÇÃO */}
                <div className="movimento-card">
                    <h2>Nova movimentação</h2>

                    <div className="movimento-form">
                        <div className="campo-grupo">
                            <label>Produto</label>
                            <select
                                value={movimento.product}
                                onChange={(e) =>
                                    setMovimento({ ...movimento, product: e.target.value })
                                }
                            >
                                <option value="">Selecione o produto</option>
                                {produtos.map((p) => (
                                    <option key={p.id} value={p.product}>
                                        {p.product_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="campo-grupo">
                            <label>Tipo</label>
                            <select
                                value={movimento.type}
                                onChange={(e) =>
                                    setMovimento({ ...movimento, type: e.target.value })
                                }
                            >
                                <option value="entrada">Entrada</option>
                                <option value="saida">Saída</option>
                            </select>
                        </div>

                        <div className="campo-grupo">
                            <label>Quantidade</label>
                            <input
                                type="number"
                                min="1"
                                value={movimento.quantity}
                                onChange={(e) =>
                                    setMovimento({ ...movimento, quantity: e.target.value })
                                }
                            />
                        </div>

                        <div className="campo-grupo">
                            <label>Descrição</label>
                            <input
                                type="text"
                                placeholder="Ex: Compra de fornecedor"
                                value={movimento.description}
                                onChange={(e) =>
                                    setMovimento({ ...movimento, description: e.target.value })
                                }
                            />
                        </div>

                        <button className="btn-confirmar-mov" onClick={enviarMovimento} disabled={enviando}>
                            {enviando ? "Enviando..." : "Confirmar movimentação"}
                        </button>
                    </div>
                </div>

            </div>

            {/* HISTÓRICO */}
            <div className="historico-card">
                <h2>Histórico de movimentações</h2>

                {loadingMovimentos ? (
                    <p className="estado-msg">Carregando histórico...</p>
                ) : movimentos.length === 0 ? (
                    <p className="estado-msg">Nenhuma movimentação registrada ainda.</p>
                ) : (
                    <div className="lista">
                        {movimentos.map((m) => (
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
            </div>

        </div>
    );
}