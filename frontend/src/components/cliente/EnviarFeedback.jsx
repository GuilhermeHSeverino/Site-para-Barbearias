import { useState, useEffect } from "react";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import "./clienteFlow.css";

function EnviarFeedback() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiro, setBarbeiro] = useState("");
  const [comentario, setComentario] = useState("");
  const [nota, setNota] = useState(5); 

  useEffect(() => {
    api.get("/api/v1/barber/", {
      headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}` }
    })
      .then((res) => setBarbeiros(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/api/v1/reviews/",
        {
          barber: barbeiro,
          comment: comentario,
          rating: nota,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}` },
        }
      );
      alert("Feedback enviado com sucesso!");
      setBarbeiro("");
      setComentario("");
      setNota(5);
    } catch (error) {
      alert("Erro ao enviar feedback.");
      console.error(error);
    }
  };

  return (
    <div className="cliente-fluxo">
      <div className="cliente-fluxo-card">
        <div className="cliente-fluxo-cabecalho">
          <div><h2>Avalie seu atendimento</h2><p>Sua opinião ajuda a barbearia a melhorar cada visita.</p></div>
          <span className="cliente-nota">★ Obrigado</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="cliente-form-grupo">
            <label className="cliente-fluxo-label" htmlFor="feedback-barbeiro">Barbeiro</label>
            <select id="feedback-barbeiro" className="cliente-fluxo-input" value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)} required>
              <option value="">Selecione um barbeiro</option>
              {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="cliente-form-grupo">
            <label className="cliente-fluxo-label" htmlFor="feedback-nota">Nota de 1 a 10</label>
            <div className="cliente-nota-valor"><span>★</span><input id="feedback-nota" type="range" min="1" max="10" value={nota} onChange={(e) => setNota(e.target.value)} style={{ flex: 1, accentColor: "#22c55e" }} /><strong>{nota}/10</strong></div>
          </div>
          <div className="cliente-form-grupo">
            <label className="cliente-fluxo-label" htmlFor="feedback-comentario">Comentário (opcional)</label>
            <textarea id="feedback-comentario" className="cliente-fluxo-input cliente-textarea" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Conte como foi sua experiência..." maxLength={500} />
            <small className="cliente-nota">{comentario.length}/500 caracteres</small>
          </div>
          <button type="submit" className="cliente-fluxo-botao principal" style={{ width: "100%" }}>Enviar avaliação</button>
        </form>
      </div>
    </div>
  );
}

export default EnviarFeedback;
