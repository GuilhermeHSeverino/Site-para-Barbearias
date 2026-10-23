import { formatarMoeda } from "../../utils/formatters";

export const estaComEstoqueBaixo = (p) => p.quantity <= (p.product_estoque_minimo ?? 5);

// Cartões com o total de produtos, o valor parado em estoque, os itens em falta e as unidades guardadas.
export default function ResumoEstoque({ produtos }) {
    const valorTotal = produtos.reduce((acc, p) => acc + p.quantity * (parseFloat(p.product_price) || 0), 0);
    const estoqueBaixo = produtos.filter(estaComEstoqueBaixo).length;
    const itensArmazenados = produtos.reduce((acc, p) => acc + p.quantity, 0);

    return (
        <div className="cards-dashboard">
            <div className="dashboard-card">
                <span>Produtos</span>
                <h2>{produtos.length}</h2>
            </div>
            <div className="dashboard-card">
                <span>Valor em estoque</span>
                <h2>{formatarMoeda(valorTotal)}</h2>
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
    );
}
