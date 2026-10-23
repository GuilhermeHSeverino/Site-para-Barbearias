import { HORARIOS, statusDoAgendamento } from "./agendaUtils";

// Os horários do dia, com o atendimento de cada um e as ações possíveis.
export default function LinhaDoTempo({ carregando, agendamentoNoHorario, onConcluir, onCancelar, onDesbloquear }) {
    return (
        <div className="agenda-timeline-card">
            {carregando ? (
                <p className="estado-msg">Carregando agenda...</p>
            ) : (
                <div className="agenda-timeline">
                    {HORARIOS.map((hora) => {
                        const ag = agendamentoNoHorario(hora);
                        const info = ag ? statusDoAgendamento(ag.status) : null;

                        return (
                            <div key={hora} className="agenda-linha">
                                <span className="agenda-hora">{hora}</span>

                                {ag ? (
                                    <div className="agenda-slot preenchido">
                                        <div className="agenda-slot-info">
                                            <strong>{ag.client_name_display}</strong>
                                            <p>{ag.service_name}</p>
                                        </div>

                                        <span className={`agenda-badge ${info.classe}`}>{info.label}</span>

                                        {ag.status === "agendado" && (
                                            <div className="agenda-slot-acoes">
                                                <button className="acao-concluir" onClick={() => onConcluir(ag.id)}>
                                                    Concluir
                                                </button>
                                                <button className="acao-cancelar" onClick={() => onCancelar(ag.id)}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                        {ag.status === "bloqueado" && (
                                            <div className="agenda-slot-acoes">
                                                <button className="acao-cancelar" onClick={() => onDesbloquear(ag.id)}>
                                                    Desbloquear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="agenda-slot vazio" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
