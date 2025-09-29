import { useEffect, useState } from "react";
import api from "../../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../constants";
import { useNavigate } from "react-router-dom";

function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const navigate = useNavigate();

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
    const clientId = decoded.user_id || decoded.id;

    // Buscar agendamentos
    api.get(`/api/v1/schedule/?client_name=${clientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setAgendamentos(res.data))
      .catch((err) => console.error(err));

    // Buscar barbeiros
    api.get("/api/v1/barber/", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setBarbeiros(res.data))
      .catch((err) => console.error(err));

    // Buscar serviços
    api.get("/api/v1/services/", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setServicos(res.data))
      .catch((err) => console.error(err));
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

  return (
    <div
      className="d-flex justify-content-center align-items-start min-vh-100 py-5"
      style={{ backgroundColor: "#121212" }}
    >
      <div
        className="p-5 rounded-4 shadow-lg text-white"
        style={{ maxWidth: "640px", width: "100%", backgroundColor: "#1E1E2F" }}
      >
        <h2 className="mb-5 text-center" style={{ fontWeight: "700", letterSpacing: "1.5px" }}>
          Meus Agendamentos
        </h2>

        {agendamentos.length === 0 ? (
          <p className="text-center fs-5" style={{ color: "#bbb" }}>
            Você ainda não realizou nenhum corte.
          </p>
        ) : (
          agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className="mb-4 p-4"
              style={{
                backgroundColor: "#2A2A3D",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
              }}
            >
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Barbeiro:</strong> {getBarbeiroNome(agendamento.barber)}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Serviço:</strong> {getServicoNome(agendamento.service)}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Data:</strong> {new Date(agendamento.date).toLocaleDateString("pt-BR")}
              </p>
              <p style={{ marginBottom: "1rem" }}>
                <strong>Início:</strong> {agendamento.start_time}
              </p>

              <button
                className="btn btn-warning fw-semibold"
                style={{ width: "100%", padding: "0.6rem", fontSize: "1rem" }}
                onClick={() => handleAvaliar(agendamento.barber)}
              >
                Avaliar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MeusAgendamentos;
