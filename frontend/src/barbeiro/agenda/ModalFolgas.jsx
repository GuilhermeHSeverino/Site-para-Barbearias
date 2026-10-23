import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";
import { dataLocal, formatarData } from "./agendaUtils";

// Bloqueio de folgas e férias (um dia ou um período) e lista dos bloqueios já programados.
export default function ModalFolgas({ diaSelecionado, folgas, onFechar, onAlterado, onRemover }) {
    const [inicio, setInicio] = useState(diaSelecionado);
    const [fim, setFim] = useState(diaSelecionado);
    const [salvando, setSalvando] = useState(false);

    const usarMesInteiro = () => {
        const base = new Date(`${inicio || diaSelecionado}T12:00:00`);
        const hoje = dataLocal();
        const primeiroDia = dataLocal(new Date(base.getFullYear(), base.getMonth(), 1));
        setInicio(primeiroDia < hoje ? hoje : primeiroDia);
        setFim(dataLocal(new Date(base.getFullYear(), base.getMonth() + 1, 0)));
    };

    const bloquear = async () => {
        if (!inicio || !fim) return;
        setSalvando(true);
        try {
            const res = await api.post("/api/v1/schedule/vacations/", { start_date: inicio, end_date: fim });
            // agendamentos já marcados no período não são cancelados; o barbeiro é avisado
            const qtd = res.data.agendamentos_no_periodo;
            if (qtd > 0) {
                alert(
                    `Período bloqueado. Atenção: você já tem ${qtd} agendamento(s) nesse período; cancele ou remarque com os clientes.`,
                );
            }
            await onAlterado();
        } catch (err) {
            alert(mensagemDeErro(err, "Não foi possível bloquear o período."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onFechar}>
            <div className="modal-card pequeno" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Folgas e férias</h2>
                    <button className="modal-fechar" onClick={onFechar}>
                        ✕
                    </button>
                </div>
                <p className="modal-data-info">
                    Os dias bloqueados ficam indisponíveis para novos agendamentos. Para bloquear um único dia, use a
                    mesma data em "De" e "Até".
                </p>
                <div className="folga-datas">
                    <div>
                        <label className="modal-label" htmlFor="folga-inicio">
                            De
                        </label>
                        <input
                            id="folga-inicio"
                            className="modal-input"
                            type="date"
                            min={dataLocal()}
                            value={inicio}
                            onChange={(e) => {
                                setInicio(e.target.value);
                                if (!fim || e.target.value > fim) setFim(e.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <label className="modal-label" htmlFor="folga-fim">
                            Até
                        </label>
                        <input
                            id="folga-fim"
                            className="modal-input"
                            type="date"
                            min={inicio || dataLocal()}
                            value={fim}
                            onChange={(e) => setFim(e.target.value)}
                        />
                    </div>
                </div>
                <div className="folga-atalhos">
                    <button
                        type="button"
                        onClick={() => {
                            setInicio(diaSelecionado);
                            setFim(diaSelecionado);
                        }}
                    >
                        Só {formatarData(diaSelecionado)}
                    </button>
                    <button type="button" onClick={usarMesInteiro}>
                        Mês inteiro
                    </button>
                </div>
                <button className="modal-confirmar" onClick={bloquear} disabled={salvando || !inicio || !fim}>
                    {salvando
                        ? "Bloqueando..."
                        : inicio === fim
                          ? `Bloquear ${formatarData(inicio || diaSelecionado)}`
                          : "Bloquear período"}
                </button>

                <h3 className="folga-titulo">Bloqueios programados</h3>
                {folgas.length === 0 ? (
                    <p className="modal-data-info">Nenhuma folga ou férias programada.</p>
                ) : (
                    <ul className="folga-lista">
                        {folgas.map((f) => (
                            <li key={f.id}>
                                <span>
                                    {f.start_date === f.end_date
                                        ? formatarData(f.start_date)
                                        : `${formatarData(f.start_date)} a ${formatarData(f.end_date)}`}
                                </span>
                                <button onClick={() => onRemover(f.id)}>Remover</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
