import { useEffect, useState } from "react";
import { ACCESS_TOKEN } from "../../constants";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./clienteFlow.css";

function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [cancelando, setCancelando] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    api
      .get("/api/v1/schedule/")
      .then((res) => {
        console.log("AGENDAMENTOS:", res.data);
        setAgendamentos(res.data);
      })
      .catch((err) => console.error(err));

    // Buscar barbeiros
    api
      .get("/api/v1/barber/")
      .then((res) => setBarbeiros(res.data))
      .catch((err) => console.error(err));

    // Buscar serviços
    api
      .get("/api/v1/services/")
      .then((res) => setServicos(res.data))
      .catch((err) => console.error(err));

  }, []);

  useEffect(() => {
    const atualizarAoVoltar = () => {
      api.get("/api/v1/schedule/")
        .then((res) => setAgendamentos(res.data))
        .catch((err) => console.error(err));
    };

    window.addEventListener("focus", atualizarAoVoltar);
    return () => window.removeEventListener("focus", atualizarAoVoltar);
  }, []);

  const getBarbeiroNome = (barberId) => {
    const b = barbeiros.find((barbeiro) => barbeiro.id === barberId);
    return b ? b.name : "Barbeiro não encontrado";
  };

  const getServicoNome = (serviceId) => {
    const s = servicos.find((servico) => servico.id === serviceId);
    return s ? s.name : "Serviço não encontrado";
  };

  const handleAvaliar = (barberId) => {
    navigate(`/cliente/feedback?barber=${barberId}`);
  };

  const cancelarAgendamento = async (id) => {
    if (!window.confirm("Deseja cancelar este corte?")) return;
    setCancelando(id);
    try {
      await api.patch(`/api/v1/schedule/${id}/cancel/`);
      setAgendamentos((atuais) => atuais.map((item) => item.id === id ? { ...item, status: "cancelado" } : item));
    } catch (error) {
      window.alert(error.response?.data?.detail || "Não foi possível cancelar o corte.");
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="cliente-fluxo">
      <div className="cliente-fluxo-card">
        <div className="cliente-fluxo-cabecalho">
          <div><h2>Meus agendamentos</h2><p>Acompanhe seus horários e avalie os atendimentos concluídos.</p></div>
          <button className="cliente-fluxo-botao principal" onClick={() => navigate("/cliente/agendar")}>＋ Agendar</button>
        </div>

        {agendamentos.length === 0 ? (
          <div className="cliente-fluxo-vazio">Você ainda não realizou nenhum agendamento.</div>
        ) : (
          <div className="cliente-agendamento-lista">
            {agendamentos.map((agendamento) => {
              const status = agendamento.status?.toLowerCase() || "agendado";
              const statusLabel = {
                agendado: "Agendado",
                confirmado: "Confirmado",
                concluido: "Concluído",
                cancelado: "Cancelado",
              }[status] || status;
              return (
                <div key={agendamento.id} className="cliente-agendamento-item">
                  <div className="cliente-agendamento-topo">
                    <div>
                      <h3>{getServicoNome(agendamento.service)}</h3>
                      <p>Com {getBarbeiroNome(agendamento.barber)}</p>
                    </div>
                    <span className={`cliente-status ${status}`}>{statusLabel}</span>
                  </div>
                  <p>📅 {agendamento.date.split("-").reverse().join("/")} às {agendamento.start_time}</p>
                  {status === "agendado" || status === "confirmado" ? <button className="cliente-avaliar cliente-cancelar" onClick={() => cancelarAgendamento(agendamento.id)} disabled={cancelando === agendamento.id}>{cancelando === agendamento.id ? "Cancelando..." : "Cancelar corte"}</button> : null}
                  {status === "agendado" || status === "confirmado" ? <button className="cliente-avaliar" onClick={() => navigate(`/cliente/agendar?reagendar=${agendamento.id}&barber=${agendamento.barber}&service=${agendamento.service}`)}>Reagendar corte →</button> : null}
                  {status === "concluido" && <button className="cliente-avaliar" onClick={() => handleAvaliar(agendamento.barber)}>Avaliar atendimento →</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeusAgendamentos;