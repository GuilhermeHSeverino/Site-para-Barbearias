import { formatarData } from "./agendaUtils";

// Os 7 próximos dias (dias de folga ficam destacados) e os botões de folgas e de novo agendamento.
export default function SeletorDeDias({
    dias,
    diaSelecionado,
    onSelecionar,
    folgaDoDia,
    onAbrirFolgas,
    onNovoAgendamento,
}) {
    return (
        <div className="agenda-topo">
            <div className="agenda-controles">
                <div className="agenda-dias">
                    {dias.map((dia) => (
                        <button
                            key={dia}
                            onClick={() => onSelecionar(dia)}
                            className={`dia-pill ${dia === diaSelecionado ? "ativo" : ""} ${folgaDoDia(dia) ? "folga" : ""}`}
                            title={folgaDoDia(dia) ? "Dia de folga/férias" : undefined}
                        >
                            {formatarData(dia)}
                        </button>
                    ))}
                </div>
                <div className="agenda-acoes-topo">
                    <button className="btn-ferias" onClick={onAbrirFolgas}>
                        Folgas e férias
                    </button>
                    <button className="btn-novo-agendamento" onClick={onNovoAgendamento}>
                        + Novo Agendamento
                    </button>
                </div>
            </div>
        </div>
    );
}
