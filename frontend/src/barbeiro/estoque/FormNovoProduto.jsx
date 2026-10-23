import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";

const PRODUTO_VAZIO = {
    name: "",
    description: "",
    price: "",
    custo: "",
    estoque_minimo: 5,
    quantity: 0,
    disponivel_na_loja: false,
};

// Cadastro de produto: o estoque inicial vira uma entrada e o custo da compra, uma saída no financeiro.
export default function FormNovoProduto({ onSalvo }) {
    const [produto, setProduto] = useState(PRODUTO_VAZIO);
    const [salvando, setSalvando] = useState(false);

    const salvar = async () => {
        if (!produto.name || !produto.price) return alert("Informe nome e preço do produto.");
        setSalvando(true);
        try {
            await api.post("/api/v1/products/", {
                name: produto.name,
                description: produto.description,
                price: produto.price,
                estoque_minimo: produto.estoque_minimo,
                initial_quantity: produto.quantity,
                disponivel_na_loja: produto.disponivel_na_loja,
                ...(produto.custo ? { custo_total: produto.custo } : {}),
            });
            setProduto(PRODUTO_VAZIO);
            onSalvo();
        } catch (err) {
            console.error(err);
            alert(mensagemDeErro(err, "Não foi possível adicionar o produto."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="movimento-card" style={{ marginBottom: "24px" }}>
            <h2>Novo produto no estoque</h2>
            <div className="movimento-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <div className="campo-grupo">
                    <label>Nome</label>
                    <input
                        value={produto.name}
                        onChange={(e) => setProduto({ ...produto, name: e.target.value })}
                        placeholder="Ex: Pomada modeladora"
                    />
                </div>
                <div className="campo-grupo">
                    <label>Descrição</label>
                    <input
                        value={produto.description}
                        onChange={(e) => setProduto({ ...produto, description: e.target.value })}
                        placeholder="Descrição do produto"
                    />
                </div>
                <div className="campo-grupo">
                    <label>Preço de venda (R$)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={produto.price}
                        onChange={(e) => setProduto({ ...produto, price: e.target.value })}
                    />
                </div>
                <div className="campo-grupo">
                    <label>Quantidade inicial</label>
                    <input
                        type="number"
                        min="0"
                        value={produto.quantity}
                        onChange={(e) => setProduto({ ...produto, quantity: e.target.value })}
                    />
                </div>
                <div className="campo-grupo">
                    <label>Custo da compra (R$, opcional)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Total pago ao fornecedor"
                        value={produto.custo}
                        onChange={(e) => setProduto({ ...produto, custo: e.target.value })}
                    />
                </div>
                <label className="campo-grupo" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                    <input
                        type="checkbox"
                        checked={produto.disponivel_na_loja}
                        onChange={(e) => setProduto({ ...produto, disponivel_na_loja: e.target.checked })}
                    />{" "}
                    Vender também na loja virtual
                </label>
                <button className="btn-confirmar-mov" onClick={salvar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar produto"}
                </button>
            </div>
        </div>
    );
}
