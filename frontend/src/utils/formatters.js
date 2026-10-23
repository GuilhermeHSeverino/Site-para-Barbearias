export function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

// "2026-10-23" -> "23/10/2026". Não usa new Date(): uma data sem hora é lida como meia-noite em UTC
// e, no horário de Brasília, apareceria como o dia anterior.
export function formatarDataISO(iso) {
    return iso ? iso.slice(0, 10).split("-").reverse().join("/") : "";
}

export function obterInicial(texto, fallback = "P") {
    return texto?.trim()?.[0]?.toUpperCase() || fallback;
}
