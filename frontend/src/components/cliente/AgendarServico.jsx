import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../../constants";
import { jwtDecode } from "jwt-decode";

export default function AgendarServico() {
  const [etapa, setEtapa] = useState(1);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbeiro, setBarbeiro] = useState("");
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/barber/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`
      }
    }).then((res) => setBarbeiros(res.data));
    axios.get("http://localhost:8000/api/v1/services/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`
      }
    }).then((res) => setServicos(res.data));
  }, []);

  const handleAgendamento = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      alert("Você precisa estar logado para agendar.");
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      alert("Token inválido. Faça login novamente.");
      return;
    }

    const clienteId = decoded.user_id || decoded.id;
    if (!clienteId) {
      alert("ID do cliente não encontrado no token.");
      return;
    }
    const body = {
      barber: barbeiro,
      service: servico,
      date: data,
      start_time: hora,
      client_name: clienteId,
    };
    if (!barbeiro || !servico || !data || !hora) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    axios
      .post("http://localhost:8000/api/v1/schedule/", body, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(() => navigate("/cliente/"))
      .catch((err) => alert("Erro ao agendar: " + (err.response?.data?.detail || err.message)));
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
      <div className="p-4 rounded shadow-lg text-white" style={{ maxWidth: "600px", width: "90%", backgroundColor: "#222" }}>
        <h2 className="mb-4 text-center">Agendamento</h2>

        {etapa === 1 && (
          <div>
            <label className="form-label mb-3">Escolha o barbeiro:</label>
            <div className="d-flex flex-column gap-2">
              {barbeiros.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBarbeiro(b.id)}
                  className={`btn ${barbeiro === b.id ? "btn-warning" : "btn-outline-warning"}`}
                  style={{ minWidth: "100px", textAlign: "left" }}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary" disabled={!barbeiro} onClick={() => setEtapa(2)}>
                Próximo
              </button>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <label className="form-label mb-3">Escolha o serviço:</label>
            <div className="d-flex flex-column gap-2">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServico(s.id)}
                  className={`btn ${servico === s.id ? "btn-warning" : "btn-outline-warning"}`}
                  style={{ minWidth: "140px", textAlign: "left" }}
                >
                  {s.name} - R$ {s.price}
                </button>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={() => setEtapa(1)}>Voltar</button>
              <button className="btn btn-primary" disabled={!servico} onClick={() => setEtapa(3)}>Próximo</button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div>
            <label className="form-label mt-2">Escolha a data:</label>
            <input type="date" className="form-control" value={data} onChange={(e) => setData(e.target.value)} />
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={() => setEtapa(2)}>Voltar</button>
              <button className="btn btn-primary" disabled={!data} onClick={() => setEtapa(4)}>Próximo</button>
            </div>
          </div>
        )}

        {etapa === 4 && (
          <div>
            <label className="form-label mt-2">Escolha o horário:</label>
            <input type="time" className="form-control" value={hora} onChange={(e) => setHora(e.target.value)} />
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={() => setEtapa(3)}>Voltar</button>
              <button className="btn btn-success" disabled={!hora} onClick={handleAgendamento}>Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
