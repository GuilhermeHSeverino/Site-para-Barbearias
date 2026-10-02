import { formatarMoeda, obterInicial } from "../../utils/formatters";

export default function ProdutoLojaCard({
    produto,
    quantidade,
    comprando,
    onQuantidadeChange,
    onComprar,
}) {
    const produtoId = produto.product;
    const estaComprando = comprando === produtoId;

    return (
        <article className="cliente-loja-card">
            <div className="cliente-loja-imagem" aria-hidden="true">
                {obterInicial(produto.product_name)}
            </div>
            <span className="cliente-nota">Disponível: {produto.quantity}</span>
            <h3>{produto.product_name}</h3>
            <strong>{formatarMoeda(produto.product_price)}</strong>
            <div className="cliente-loja-compra">
                <label className="sr-only" htmlFor={`quantidade-${produtoId}`}>
                    Quantidade de {produto.product_name}
                </label>
                <input
                    id={`quantidade-${produtoId}`}
                    type="number"
                    min="1"
                    max={produto.quantity}
                    value={quantidade}
                    onChange={(event) => onQuantidadeChange(produtoId, event.target.value)}
                />
                <button
                    className="cliente-fluxo-botao principal"
                    disabled={estaComprando}
                    onClick={() => onComprar(produto)}
                >
                    {estaComprando ? "..." : "Comprar"}
                </button>
            </div>
        </article>
    );
}
