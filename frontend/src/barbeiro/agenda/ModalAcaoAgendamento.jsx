import { useState } from "react";
import api from "../../api";
import { mensagemDeErro } from "../../utils/mensagemErro";
import { PAGAMENTOS } from "../../utils/pagamentos";

// Confirma uma ação sobre um horário: concluir (com a forma de pagamento), cancelar ou desbloquear.
// acao = { id, tipo: "concluir" | "cancelar" | "desbloquear" }
export default function ModalAcaoAgendamento({ acao, onFechar, onConcluida }) {
    const [formaPagamento, setFormaPagamento] = useState("dinheiro");

    const confirmar = async () => {
        try {
            if (acao.tipo === "concluir") {
                // a API lança a receita no financeiro ao concluir
                await api.patch(`/api/v1/schedule/${acao.id}/`, {
                    status: "concluido",
                    payment_method: formaPagamento,
                });
            } else if (acao.tipo === "cancelar") {
                await api.patch(`/api/v1/schedule/${acao.id}/`, { status: "cancelado" });
            } else {
                // só bloqueios podem ser excluídos; atendimentos são cancelados
                await api.delete(`/api/v1/schedule/${acao.id}/`);
            }
            onConcluida();
        } catch (err) {
            console.error(err);
            alert(mensagemDeErro(err, "Não foi possível atualizar o agendamento."));
        }
    };

    return (
        <div className="modal-backdrop" onClick={onFechar}>
            <div className="modal-card pequeno" onClick={(e) => e.stopPropagation()}>
                {acao.tipo === "concluir" ? (
                    <>
                        <h2>Concluir atendimento</h2>
                        <label className="modal-label">Forma de pagamento</label>
                        <select
                            className="modal-input"
                            value={formaPagamento}
                            onChange={(e) => setFormaPagamento(e.target.value)}
                        >
                            {PAGAMENTOS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>

                        <button className="modal-confirmar" onClick={confirmar}>
                            Confirmar conclusão
                        </button>
                    </>
                ) : acao.tipo === "desbloquear" ? (
                    <>
                        <h2>Desbloquear horário?</h2>
                        <p className="modal-data-info">Este horário voltará a ficar disponível para agendamentos.</p>
                        <button className="modal-confirmar perigo" onClick={confirmar}>
                            Confirmar desbloqueio
                        </button>
                    </>
                ) : (
                    <>
                        <h2>Cancelar agendamento?</h2>
                        <p className="modal-data-info">Essa ação não pode ser desfeita.</p>
                        <button className="modal-confirmar perigo" onClick={confirmar}>
                            Confirmar cancelamento
                        </button>
                    </>
                )}

                <button className="btn-voltar modal-voltar" onClick={onFechar}>
                    ← Voltar
                </button>
            </div>
        </div>
    );
}
