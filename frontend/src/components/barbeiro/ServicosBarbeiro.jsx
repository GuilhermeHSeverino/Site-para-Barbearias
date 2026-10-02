import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

/**
 * Componente para Gestão de Serviços do Barbeiro.
 * Redesenhado para seguir rigorosamente o padrão visual do Dashboard (MenuBarbeiro).
 */
function ServicosBarbeiro() {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        duration: "00:30:00"
    });
    const navigate = useNavigate();

    useEffect(() => {
        carregarServicos();
    }, []);

    const carregarServicos = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/v1/services/");
            setServicos(res.data);
        } catch (err) {
            console.error("Erro ao carregar serviços:", err);
            alert("Erro ao carregar serviços.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/v1/services/${editingId}/`, formData);
            } else {
                await api.post("/api/v1/services/", formData);
            }
            closeModal();
            carregarServicos();
        } catch (err) {
            console.error("Erro ao salvar serviço:", err);
            alert("Erro ao salvar serviço. Verifique o formato da duração (HH:MM:SS).");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir este serviço?")) return;
        try {
            await api.delete(`/api/v1/services/${id}/`);
            carregarServicos();
        } catch (err) {
            console.error("Erro ao excluir serviço:", err);
            alert("Erro ao excluir serviço.");
        }
    };

    const openModal = (servico = null) => {
        if (servico) {
            setEditingId(servico.id);
            setFormData({
                name: servico.name,
                price: servico.price,
                duration: servico.duration
            });
        } else {
            setEditingId(null);
            setFormData({ name: "", price: "", duration: "00:30:00" });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    const formatarMoeda = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div style={{ width: '95%', maxWidth: '1400px', margin: '0 auto', padding: '40px 0', color: 'white' }}>

            {/* HEADER - Padrão Premium */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate("/barbeiro/")}
                        style={{
                            background: 'none',
                            border: '1px solid #2a2a2a',
                            color: '#9ca3af',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: '0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'white'}
                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                    >
                        ← Voltar
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: 'white' }}>
                            Catálogo de Serviços ✂️
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0 0' }}>
                            Gerencie seus serviços, preços e durações.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    style={{
                        backgroundColor: '#22c55e',
                        color: '#0d0d0d',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 20px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: '0.2s',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
                >
                    + Novo Serviço
                </button>
            </div>

            {loading ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>Carregando serviços...</p>
            ) : servicos.length === 0 ? (
                <div style={{
                    backgroundColor: '#171717',
                    border: '1px solid #2a2a2a',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#9ca3af'
                }}>
                    <p>Nenhum serviço cadastrado.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {servicos.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                background: '#171717',
                                border: '1px solid #2a2a2a',
                                borderRadius: '16px',
                                padding: '24px',
                                transition: '0.2s',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#22c55e';
                                e.currentTarget.style.transform = 'translateY(-3px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#2a2a2a';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'white' }}>
                                    {s.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => openModal(s)}
                                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}
                                        onMouseEnter={(e) => e.target.style.color = '#22c55e'}
                                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}
                                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div>
                                    <span style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Preço</span>
                                    <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '18px' }}>
                                        {formatarMoeda(parseFloat(s.price))}
                                    </span>
                                </div>
                                <div style={{ borderLeft: '1px solid #2a2a2a', paddingLeft: '24px' }}>
                                    <span style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Duração</span>
                                    <span style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>
                                        {s.duration}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL - Estilo Dashboard */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#171717',
                        border: '1px solid #2a2a2a',
                        borderRadius: '20px',
                        width: '//90%',
                        maxWidth: '450px',
                        padding: '32px',
                        color: 'white'
                    }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
                            {editingId ? "Editar Serviço" : "Novo Serviço"}
                        </h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '14px' }}>Nome do Serviço</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    style={{
                                        backgroundColor: '#121212',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        outline: 'none',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '14px' }}>Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        style={{
                                            backgroundColor: '#121212',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            color: 'white',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '14px' }}>Duração (HH:MM:SS)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.duration}
                                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                        style={{
                                            backgroundColor: '#121212',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            color: 'white',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'transparent',
                                        border: '1px solid #2a2a2a',
                                        color: '#9ca3af',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = 'white'}
                                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#22c55e',
                                        border: 'none',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
                                >
                                    {editingId ? "Salvar" : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServicosBarbeiro;
