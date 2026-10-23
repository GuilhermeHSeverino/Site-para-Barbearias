import { estaComEstoqueBaixo } from "./ResumoEstoque";

// Produtos do estoque com a quantidade, o alerta de estoque baixo e o botão para registrar entrada ou saída.
export default function ListaDeProdutos({ produtos, carregando, busca, onMovimentar }) {
    return (
        <div className="produtos-card">
            <h2>Produtos</h2>

            {carregando ? (
                <p className="estado-msg">Carregando produtos...</p>
            ) : produtos.length === 0 ? (
                <p className="estado-msg">
                    {busca ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado."}
                </p>
            ) : (
                <div className="lista">
                    {produtos.map((p) => (
                        <div key={p.id} className="item com-acao">
                            <div>
                                <strong>{p.product_name}</strong>
                                <p>R$ {parseFloat(p.product_price || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p>Qtd: {p.quantity}</p>
                            </div>
                            <div>
                                {estaComEstoqueBaixo(p) ? (
                                    <span className="status red">Baixo</span>
                                ) : (
                                    <span className="status green">OK</span>
                                )}
                            </div>
                            <div>
                                <button className="btn-movimentar" onClick={() => onMovimentar(p.product)}>
                                    Movimentar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
