// src/pages/FeedbacksBarbeiro.jsx
import { useEffect, useState } from "react";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";

function FeedbacksBarbeiro() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const barberId = localStorage.getItem("BARBER_ID"); // id do barbeiro logado
        if (!token || !barberId) return;

        api
            .get(`/api/v1/feedbacks/?barber=${barberId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setFeedbacks(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Erro ao carregar feedbacks:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div
            className="min-vh-100 position-relative"
            style={{
                background: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)",
                padding: "3rem 1rem",
            }}
        >
            <h1 className="text-white text-center display-5 fw-bold mb-4 text-shadow-lg">
                Feedbacks Recebidos
            </h1>

            {loading ? (
                <p className="text-light text-center fs-5">Carregando feedbacks...</p>
            ) : feedbacks.length > 0 ? (
                <div className="d-flex flex-column align-items-center gap-3">
                    {feedbacks.map((fb) => (
                        <div
                            key={fb.id}
                            className="p-3 rounded-3 shadow mb-3 bg-dark text-light"
                            style={{ minWidth: "300px", maxWidth: "600px", width: "100%" }}
                        >
                            <p style={{ marginBottom: "0.25rem" }}>
                                <strong>Cliente:</strong> {fb.client_name || "Anônimo"}
                            </p>
                            <p style={{ marginBottom: "0.25rem" }}>
                                <strong>Serviço:</strong> {fb.service_name || "—"}
                            </p>
                            <p style={{ marginBottom: "0.25rem" }}>
                                <strong>Nota:</strong> {fb.rating || "—"} ⭐
                            </p>
                            <p style={{ marginBottom: "0.25rem" }}>
                                <strong>Comentário:</strong> {fb.comment || "Sem comentário"}
                            </p>
                            <p style={{ marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                                <strong>Data:</strong>{" "}
                                {new Date(fb.created_at).toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-light text-center fs-5">
                    Nenhum feedback encontrado.
                </p>
            )}
        </div>
    );
}

export default FeedbacksBarbeiro;
