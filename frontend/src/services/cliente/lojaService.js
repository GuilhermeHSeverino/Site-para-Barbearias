import api from "../../api";

export async function listarProdutosDisponiveis() {
    const response = await api.get("/api/v1/stock/");
    return response.data.filter(
        (item) => item.quantity > 0 && item.product_disponivel_na_loja
    );
}

export async function listarBarbeirosParaRetirada() {
    const response = await api.get("/api/v1/barber/");
    return response.data;
}

export async function criarPedidoDeProduto({ product, quantity, barber }) {
    return api.post("/api/v1/stores/sale/", {
        product,
        quantity,
        barber,
    });
}
