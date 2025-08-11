import { useEffect, useState } from "react";
import api from "../../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../constants";
import { useNavigate } from "react-router-dom";

function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const decoded = jwtDecode(token);
    const clientId = decoded.user_id || decoded.id;

    api.get(`/api/v1/schedule/?client_name=${clientId}`)
      .then((res) => setAgendamentos(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleAvaliar = (barberId) => {
    // Enviar para a tela de feedback, com ID do barbeiro como query param (opcional)
    navigate(`/cliente/feedback?barber=${barberId}`);
  };

  return (
    <div className="container mt-5 text-white">
      <h2>Meus Agendamentos</h2>
      {agendamentos.length === 0 ? (
        <p>Você ainda não realizou nenhum corte.</p>
      ) : (
        agendamentos.map((agendamento) => (
          <div key={agendamento.id} className="card mb-3 bg-secondary p-3">
            <p><strong>Barbeiro:</strong> {agendamento.barber_name}</p>
            <p><strong>Serviço:</strong> {agendamento.service_name}</p>
            <p><strong>Data:</strong> {agendamento.date}</p>
            <p><strong>Início:</strong> {agendamento.start_time}</p>

            <button
              className="btn btn-outline-light"
              onClick={() => handleAvaliar(agendamento.barber)}
            >
              Avaliar
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default MeusAgendamentos;
