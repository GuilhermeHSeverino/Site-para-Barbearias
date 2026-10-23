import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";

// Entrada ou saída manual de um produto. O custo informado numa entrada vira uma saída no financeiro.
export default function FormMovimentacao({ produtos, produtoInicial, onFechar, onSalvo }) {
    const [movimento, setMovimento] = useState({
        product: produtoInicial || "",
        type: "entrada",
        quantity: 1,
        description: "",
        custo: "",
    });
    const [enviando, setEnviando] = useState(false);

    const enviar = async () => {
        if (!movimento.product) return alert("Selecione um produto");
        setEnviando(true);
        try {
            const { custo, ...dados } = movimento;
            if (dados.type === "entrada" && custo) dados.custo_total = custo;
            await api.post("/api/v1/stock-movements/", dados);
            onSalvo();
        } catch (err) {
            console.error(err);
            alert(mensagemDeErro(err, "Erro ao registrar movimentação."));
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="movimento-card">
            <div className="movimento-topo">
                <h2>Nova movimentação</h2>
                <button className="btn-fechar" onClick={onFechar}>
                    ✕
                </button>
            </div>

            <div className="movimento-form">
                <div className="campo-grupo">
                    <label>Produto</label>
                    <select
                        value={movimento.product}
                        onChange={(e) => setMovimento({ ...movimento, product: e.target.value })}
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
                        onChange={(e) => setMovimento({ ...movimento, type: e.target.value })}
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
                        onChange={(e) => setMovimento({ ...movimento, quantity: e.target.value })}
                    />
                </div>

                {movimento.type === "entrada" && (
                    <div className="campo-grupo">
                        <label>Custo da compra (R$, opcional)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Total pago ao fornecedor"
                            value={movimento.custo}
                            onChange={(e) => setMovimento({ ...movimento, custo: e.target.value })}
                        />
                    </div>
                )}

                <div className="campo-grupo">
                    <label>Descrição</label>
                    <input
                        type="text"
                        placeholder="Ex: Compra de fornecedor"
                        value={movimento.description}
                        onChange={(e) => setMovimento({ ...movimento, description: e.target.value })}
                    />
                </div>

                <button className="btn-confirmar-mov" onClick={enviar} disabled={enviando}>
                    {enviando ? "Enviando..." : "Confirmar movimentação"}
                </button>
            </div>
        </div>
    );
}
