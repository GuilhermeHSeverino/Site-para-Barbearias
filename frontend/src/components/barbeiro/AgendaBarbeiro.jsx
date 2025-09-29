import { useEffect, useState } from "react";
import api from "../../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../constants";

function AgendaBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().toLocaleDateString("pt-BR"));

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      console.error("Token inválido");
      return;
    }

    const barberId = decoded.user_id; // usa diretamente o user_id
    console.log("Barbeiro ID do token:", barberId);

    api.get(`/api/v1/schedule/?barber=${barberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setAgendamentos(res.data);
        console.log("Agendamentos carregados:", res.data);
      })
      .catch((err) => console.error("Erro ao carregar agendamentos:", err));
  }, []);

  const agendamentosPorDia = agendamentos.reduce((acc, ag) => {
    const dia = new Date(ag.date).toLocaleDateString("pt-BR");
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(ag);
    return acc;
  }, {});

  const proximosDias = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("pt-BR");
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "concluido":
        return "bg-success text-white";
      case "cancelado":
        return "bg-danger text-white";
      default:
        return "bg-warning text-dark";
    }
  };

  return (
    <div
      className="min-vh-100 position-relative"
      style={{ background: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)", padding: "3rem 1rem" }}
    >
      <h1 className="text-white text-center display-5 fw-bold mb-4 text-shadow-lg">
        Agenda do Barbeiro
      </h1>

      <div className="d-flex justify-content-center gap-3 mb-5 flex-wrap">
        {proximosDias.map((dia) => (
          <button
            key={dia}
            onClick={() => setDiaSelecionado(dia)}
            className={`px-4 py-2 rounded-3 fw-semibold ${dia === diaSelecionado ? "bg-info text-white" : "bg-secondary text-white"
              }`}
          >
            {dia}
          </button>
        ))}
      </div>

      {agendamentosPorDia[diaSelecionado]?.length > 0 ? (
        agendamentosPorDia[diaSelecionado]
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
          .map((ag) => (
            <div
              key={ag.id}
              className={`p-3 rounded-3 shadow mb-3 ${getStatusColor(ag.status)}`}
              style={{ minWidth: "300px" }}
            >
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Cliente:</strong> {ag.client_name}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Serviço:</strong> {ag.service?.name || "Serviço não encontrado"}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Início:</strong> {ag.start_time}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Fim:</strong> {ag.end_time}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Status:</strong> {ag.status || "Agendado"}
              </p>
            </div>
          ))
      ) : (
        <p className="text-light text-center fs-5">Nenhum agendamento para este dia.</p>
      )}
    </div>
  );
}

export default AgendaBarbeiro;
