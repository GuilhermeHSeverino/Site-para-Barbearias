export function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function obterInicial(texto, fallback = "P") {
    return texto?.trim()?.[0]?.toUpperCase() || fallback;
}
