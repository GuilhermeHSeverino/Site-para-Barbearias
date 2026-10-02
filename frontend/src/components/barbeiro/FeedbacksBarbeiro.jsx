import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import "./feedbacks.css";

function Estrelas({ rating }) {
    // rating vai de 1 a 10, convertendo pra escala de 5 estrelas
    const notaEm5 = rating / 2;
    const cheias = Math.round(notaEm5);

    return (
        <span className="estrelas">
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= cheias ? "estrela cheia" : "estrela vazia"}>
                    ★
                </span>
            ))}
        </span>
    );
}

function corDaNota(rating) {
    if (rating >= 8) return "nota-badge verde";
    if (rating >= 5) return "nota-badge amarelo";
    return "nota-badge vermelho";
}

function FeedbacksBarbeiro() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregar();
    }, []);

    const carregar = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setErro("Você precisa estar logado.");
            setLoading(false);
            return;
        }

        let barberId;
        try {
            const decoded = jwtDecode(token);
            barberId = decoded.barber_id;
        } catch {
            setErro("Sessão inválida. Faça login novamente.");
            setLoading(false);
            return;
        }

        if (!barberId) {
            setErro("Este usuário não está associado a um barbeiro.");
            setLoading(false);
            return;
        }

        try {
            const res = await api.get("/api/v1/reviews/");
            const meus = res.data.filter((fb) => fb.barber === barberId);
            setFeedbacks(meus);
        } catch (err) {
            console.error("Erro ao carregar feedbacks:", err);
            setErro("Não foi possível carregar os feedbacks.");
        } finally {
            setLoading(false);
        }
    };

    const totalFeedbacks = feedbacks.length;

    const notaMedia =
        totalFeedbacks === 0
            ? 0
            : feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedbacks;

    const notas = feedbacks.map((f) => f.rating);
    const notaMaisAlta = notas.length ? Math.max(...notas) : 0;
    const notaMaisBaixa = notas.length ? Math.min(...notas) : 0;

    return (
        <div className="feedbacks-container">

            {/* HEADER */}
            <div className="feedbacks-header">
                <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>
                    ← Voltar
                </button>

                <div>
                    <h1>⭐ Feedbacks Recebidos</h1>
                    <p className="feedbacks-subtitle">
                        Acompanhe as avaliações dos seus clientes
                    </p>
                </div>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            {/* CARDS DE RESUMO */}
            <div className="cards-dashboard">
                <div className="dashboard-card">
                    <span>Total de avaliações</span>
                    <h2>{totalFeedbacks}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Nota média</span>
                    <h2>{notaMedia.toFixed(1)}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Nota mais alta</span>
                    <h2 className="verde-texto">{totalFeedbacks ? notaMaisAlta : "—"}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Nota mais baixa</span>
                    <h2 className="vermelho-texto">{totalFeedbacks ? notaMaisBaixa : "—"}</h2>
                </div>
            </div>

            {/* LISTA DE FEEDBACKS */}
            <div className="feedbacks-lista-card">
                <h2>Avaliações</h2>

                {loading ? (
                    <p className="estado-msg">Carregando feedbacks...</p>
                ) : erro ? null : feedbacks.length === 0 ? (
                    <p className="estado-msg">Nenhum feedback encontrado.</p>
                ) : (
                    <div className="feedbacks-grid">
                        {feedbacks.map((fb) => (
                            <div key={fb.id} className="feedback-item">
                                <div className="feedback-topo">
                                    <Estrelas rating={fb.rating} />
                                    <span className={corDaNota(fb.rating)}>{fb.rating}/10</span>
                                </div>

                                <p className="feedback-comentario">
                                    {fb.comment || "Sem comentário"}
                                </p>

                                <p className="feedback-data">
                                    {new Date(fb.created_at).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

export default FeedbacksBarbeiro;