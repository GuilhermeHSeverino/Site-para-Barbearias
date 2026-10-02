import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import { jwtDecode } from "jwt-decode";

/**
 * Componente de Perfil do Cliente para o Barbeiro.
 * Inclui: Informações básicas, Notas Privadas e Histórico de Visitas.
 */
function PerfilClienteBarbeiro() {
    const { id } = useParams();
    const [cliente, setCliente] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [nota, setNota] = useState("");
    const [notaId, setNotaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarDados();
    }, [id]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const resClient = await api.get(`/api/v1/client/${id}/`);
            setCliente(resClient.data);

            const resHistory = await api.get(`/api/v1/client-history/${id}/`);
            setHistorico(resHistory.data);

            const token = localStorage.getItem(ACCESS_TOKEN);
            const decoded = jwtDecode(token);
            const email = decoded.email;
            await api.get(`/api/v1/barber/?email=${email}`);

            const resNotes = await api.get(`/api/v1/barber-notes/`);
            const clientNote = resNotes.data.find(n => n.client === parseInt(id));

            if (clientNote) {
                setNotaId(clientNote.id);
                setNota(clientNote.note);
            } else {
                setNotaId(null);
                setNota("");
            }

        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
        } finally {
            setLoading(false);
        }
    };

    const salvarNota = async () => {
        setSaving(true);
        try {
            if (notaId) {
                await api.put(`/api/v1/barber-notes/${notaId}/`, { note: nota });
            } else {
                const token = localStorage.getItem(ACCESS_TOKEN);
                const decoded = jwtDecode(token);
                const email = decoded.email;
                const resBarber = await api.get(`/api/v1/barber/?email=${email}`);
                const barberId = resBarber.data[0].id;

                const res = await api.post(`/api/v1/barber-notes/create/`, {
                    client: parseInt(id),
                    barber: barberId,
                    note: nota
                });
                setNotaId(res.data.id);
            }
            setFeedback("Nota salva com sucesso.");
        } catch (err) {
            console.error("Erro ao salvar nota:", err);
            setFeedback("Não foi possível salvar a nota.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>Carregando perfil do cliente...</p>;
    }

    if (!cliente) {
        return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>Cliente não encontrado.</p>;
    }

    const nomeCliente = cliente.name || "Cliente";
    const visitasConcluidas = historico.filter((item) => item.status === 'concluído').length;
    const ultimaVisita = historico[0];
    const servicos = historico.reduce((contagem, item) => {
        contagem[item.service] = (contagem[item.service] || 0) + 1;
        return contagem;
    }, {});
    const servicoMaisRealizado = Object.entries(servicos).sort((a, b) => b[1] - a[1])[0];
    const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR');

    return (
        <div style={{ width: '95%', maxWidth: '1400px', margin: '0 auto', padding: '32px 0 48px', color: 'white' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => navigate("/barbeiro/clientes")}
                    style={{
                        background: 'none',
                        border: '1px solid #2a2a2a',
                        color: '#9ca3af',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                    ← Voltar para Clientes
                </button>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Perfil do cliente</span>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1b241f 0%, #171717 58%)', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ width: '76px', height: '76px', borderRadius: '50%', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: '700', color: '#22c55e', border: '3px solid #22c55e' }}>
                        {nomeCliente[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Relacionamento</p>
                        <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: 'white' }}>{nomeCliente}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: '6px 0 0' }}>Acompanhe preferências e histórico em um só lugar.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {cliente.phone && <a href={`tel:${cliente.phone}`} style={{ background: '#22c55e', color: '#07130b', textDecoration: 'none', borderRadius: '9px', padding: '10px 14px', fontSize: '13px', fontWeight: '700' }}>📞 Ligar</a>}
                    {cliente.email && <a href={`mailto:${cliente.email}`} style={{ background: '#252a27', color: 'white', textDecoration: 'none', border: '1px solid #3b453f', borderRadius: '9px', padding: '10px 14px', fontSize: '13px', fontWeight: '600' }}>✉️ E-mail</a>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                    ['Visitas registradas', historico.length, 'Total de atendimentos'],
                    ['Atendimentos concluídos', visitasConcluidas, 'Histórico confirmado'],
                    ['Última visita', ultimaVisita ? formatarData(ultimaVisita.date) : 'Ainda não', ultimaVisita ? ultimaVisita.service : 'Sem agendamentos']
                ].map(([label, value, detail]) => (
                    <div key={label} style={{ background: '#171717', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '18px 20px' }}>
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 10px' }}>{label}</p>
                        <strong style={{ display: 'block', color: 'white', fontSize: '22px', marginBottom: '4px' }}>{value}</strong>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>{detail}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                {/* COLUNA ESQUERDA: INFO BÁSICA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                        background: '#171717',
                        border: '1px solid #2a2a2a',
                        borderRadius: '20px',
                        padding: '32px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#2a2a2a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            fontWeight: '700',
                            color: '#22c55e',
                            border: '4px solid #22c55e',
                            margin: '0 auto 20px'
                        }}>
                            {nomeCliente[0].toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: 'white' }}>
                            {nomeCliente}
                        </h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>Cliente Fiel</p>

                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9ca3af', fontSize: '14px' }}>
                                <span>📞</span> {cliente.phone || 'Telefone não informado'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9ca3af', fontSize: '14px' }}>
                                <span>✉️</span> {cliente.email || 'E-mail não informado'}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: '#171717',
                        border: '1px solid #2a2a2a',
                        borderRadius: '20px',
                        padding: '24px'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
                            Notas Privadas 📝
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 16px' }}>Registre preferências, cortes e detalhes importantes para o próximo atendimento.</p>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            placeholder="Anote preferências do cliente, cortes anteriores, etc..."
                            style={{
                                width: '100%',
                                height: '150px',
                                backgroundColor: '#121212',
                                border: '1px solid #2a2a2a',
                                borderRadius: '12px',
                                padding: '12px',
                                color: 'white',
                                outline: 'none',
                                resize: 'none',
                                boxSizing: 'border-box',
                                marginBottom: '16px'
                            }}
                        />
                        <button
                            onClick={salvarNota}
                            disabled={saving}
                            style={{
                                width: '100%',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            {saving ? "Salvando..." : "Salvar Nota"}
                        </button>
                        {feedback && <p style={{ color: feedback.includes('sucesso') ? '#4ade80' : '#f87171', fontSize: '12px', margin: '12px 0 0', textAlign: 'center' }}>{feedback}</p>}
                    </div>
                </div>

                {/* COLUNA DIREITA: HISTÓRICO */}
                <div style={{
                    background: '#171717',
                    border: '1px solid #2a2a2a',
                    borderRadius: '20px',
                    padding: '32px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'white' }}>Histórico de Visitas 📅</h3>
                            <p style={{ color: '#6b7280', fontSize: '13px', margin: '6px 0 0' }}>{servicoMaisRealizado ? `Serviço mais realizado: ${servicoMaisRealizado[0]}` : 'As visitas do cliente aparecerão aqui.'}</p>
                        </div>
                        <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: '700' }}>{historico.length} registro(s)</span>
                    </div>

                    {historico.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                            <p>Este cliente ainda não possui histórico de visitas.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {historico.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        backgroundColor: '#121212',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                                            {item.service}
                                        </span>
                                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                                            {formatarData(item.date)} às {item.start_time}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: item.status === 'concluído' ? '#065f46' : '#3f3f46',
                                        color: item.status === 'concluído' ? '#34d399' : '#d1d5db',
                                        textTransform: 'capitalize'
                                    }}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PerfilClienteBarbeiro;
