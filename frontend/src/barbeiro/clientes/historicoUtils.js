// Nomes dos status como aparecem na tela (a API usa os valores sem acento).
export const NOMES_STATUS = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
    bloqueado: "Bloqueado",
};

export const formatarData = (data) => new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
