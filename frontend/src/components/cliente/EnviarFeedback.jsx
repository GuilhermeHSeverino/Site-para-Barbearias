import { useState, useEffect } from "react";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";

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
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: "#121212" }}
    >
      <div
        className="p-4 rounded shadow-lg text-white"
        style={{ maxWidth: "600px", width: "90%", backgroundColor: "#222" }}
      >
        <h2 className="mb-4 text-center">Avaliar Corte</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Barbeiro</label>
            <select
              className="form-control"
              value={barbeiro}
              onChange={(e) => setBarbeiro(e.target.value)}
              required
            >
              <option value="">Selecione um barbeiro</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Comentário (opcional)</label>
            <textarea
              className="form-control"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe seu comentário (máx 500 caracteres)"
              maxLength={500}
            />
          </div>

          <div className="mb-3">
            <label>Nota (1 a 10)</label>
            <input
              type="number"
              className="form-control"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              min={1}
              max={10}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100">
            Enviar Feedback
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnviarFeedback;
