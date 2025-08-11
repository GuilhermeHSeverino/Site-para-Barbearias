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
    axios.get("http://localhost:8000/api/v1/barber/").then((res) => setBarbeiros(res.data));
    axios.get("http://localhost:8000/api/v1/services/").then((res) => setServicos(res.data));
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



    const body = {
      barber: barbeiro,
      service: servico,
      date: data,
      start_time: hora,
      client_name: clienteId,
    };
    axios
      .post("http://localhost:8000/api/v1/schedule/", body, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`
        }
      })
      .then(() => navigate("/cliente/"))
      .catch((err) => alert("Erro ao agendar: " + err.response?.data?.detail || err.message));
  };

  return (
    <div className="container py-5 text-white">
      <div className="bg-dark p-4 rounded shadow-lg mx-auto" style={{ maxWidth: "600px" }}>
        <h2 className="mb-4 text-center">Agendamento</h2>

        {etapa === 1 && (
          <div>
            <label className="form-label">Escolha o barbeiro:</label>
            <select className="form-select" value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)}>
              <option value="">Selecione</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-primary" disabled={!barbeiro} onClick={() => setEtapa(2)}>Próximo</button>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <label className="form-label">Escolha o serviço:</label>
            <select className="form-select" value={servico} onChange={(e) => setServico(e.target.value)}>
              <option value="">Selecione</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
              ))}
            </select>
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-secondary" onClick={() => setEtapa(1)}>Voltar</button>
              <button className="btn btn-primary" disabled={!servico} onClick={() => setEtapa(3)}>Próximo</button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div>
            <label className="form-label">Escolha a data:</label>
            <input type="date" className="form-control" value={data} onChange={(e) => setData(e.target.value)} />
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-secondary" onClick={() => setEtapa(2)}>Voltar</button>
              <button className="btn btn-primary" disabled={!data} onClick={() => setEtapa(4)}>Próximo</button>
            </div>
          </div>
        )}

        {etapa === 4 && (
          <div>
            <label className="form-label">Escolha o horário:</label>
            <input type="time" className="form-control" value={hora} onChange={(e) => setHora(e.target.value)} />
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-secondary" onClick={() => setEtapa(3)}>Voltar</button>
              <button className="btn btn-success" disabled={!hora} onClick={handleAgendamento}>Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
