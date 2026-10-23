// horários exibidos na linha do tempo, de 30 em 30 minutos
export const HORARIOS = (() => {
    const horarios = [];
    for (let h = 8; h <= 20; h++) {
        horarios.push(`${String(h).padStart(2, "0")}:00`);
        horarios.push(`${String(h).padStart(2, "0")}:30`);
    }
    return horarios;
})();

// data no fuso local (toISOString usaria UTC e trocaria o dia à noite)
export function dataLocal(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatarData(iso) {
    return iso.split("-").reverse().join("/");
}

export function statusDoAgendamento(status) {
    switch (status?.toLowerCase()) {
        case "concluido":
            return { label: "Concluído", classe: "badge-verde" };
        case "cancelado":
            return { label: "Cancelado", classe: "badge-vermelho" };
        case "bloqueado":
            return { label: "Bloqueado", classe: "badge-amarelo" };
        default:
            return { label: "Agendado", classe: "badge-amarelo" };
    }
}
