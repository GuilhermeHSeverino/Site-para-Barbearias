import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./agenda.css"; // Reusing some of the premium styles

const PROFILE_ENDPOINT = "/api/v1/profile/update/";

export default function ConfiguracoesBarbeiro() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        bio: "",
        specialties: "",
        work_start: "08:00",
        work_end: "20:00",
        break_start: "12:00",
        break_end: "13:00",
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        carregarPerfil();
    }, []);

    useEffect(() => {
        if (!photo) {
            setPhotoPreview("");
            return;
        }

        const previewUrl = URL.createObjectURL(photo);
        setPhotoPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [photo]);

    const carregarPerfil = async () => {
        setLoading(true);
        try {
            const res = await api.get(PROFILE_ENDPOINT);
            const data = res.data;
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                bio: data.bio || "",
                specialties: data.specialties || "",
                work_start: data.work_start || "08:00",
                work_end: data.work_end || "20:00",
                break_start: data.break_start || "12:00",
                break_end: data.break_end || "13:00",
                photo: data.photo || "",
            });
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const perfilData = {
                name: formData.name,
                phone: formData.phone,
                bio: formData.bio,
                specialties: formData.specialties,
                work_start: formData.work_start,
                work_end: formData.work_end,
                break_start: formData.break_start,
                break_end: formData.break_end,
            };

            let data = perfilData;
            if (photo) {
                data = new FormData();
                Object.entries(perfilData).forEach(([key, value]) => {
                    data.append(key, value);
                });
                data.append("photo", photo);
            }

            await api.patch(PROFILE_ENDPOINT, data);
            alert("Perfil atualizado com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar perfil:", err.response?.data || err);
            alert("Erro ao salvar perfil.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Carregando configurações...</p>;

    return (
        <div className="agenda-container">
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    className="btn-voltar"
                    onClick={() => navigate("/barbeiro/")}
                    style={{
                        background: 'none',
                        border: '1px solid #2a2a2a',
                        color: '#9ca3af',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                    ← Voltar
                </button>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0 }}>
                    Configurações do Perfil
                </h1>
            </div>

            <div style={{
                background: '#171717',
                border: '1px solid #2a2a2a',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Foto de Perfil */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#2a2a2a',
                            border: '3px solid #22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {photoPreview || formData.photo ? (
                                <img src={photoPreview || formData.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '40px', color: '#444' }}>👤</span>
                            )}
                        </div>
                        <div>
                            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Foto de Perfil</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhoto(e.target.files[0])}
                                style={{ color: '#9ca3af', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    {/* Info Básica */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#9ca3af', fontSize: '14px' }}>Nome</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ background: '#121212', border: '1px solid #2a2a2a', color: 'white', padding: '12px', borderRadius: '8px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#9ca3af', fontSize: '14px' }}>Telefone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={{ background: '#121212', border: '1px solid #2a2a2a', color: 'white', padding: '12px', borderRadius: '8px' }}
                            />
                        </div>
                    </div>

                    {/* Bio e Especialidades */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#9ca3af', fontSize: '14px' }}>Bio / Sobre você</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            style={{ background: '#121212', border: '1px solid #2a2a2a', color: 'white', padding: '12px', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }}
                            placeholder="Ex: Barbeiro com 10 anos de experiência em cortes clássicos..."
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#9ca3af', fontSize: '14px' }}>Especialidades (separadas por vírgula)</label>
                        <input
                            type="text"
                            value={formData.specialties}
                            onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                            style={{ background: '#121212', border: '1px solid #2a2a2a', color: 'white', padding: '12px', borderRadius: '8px' }}
                            placeholder="Ex: Degradê, Barboterapia, Platinado"
                        />
                    </div>

                    {/* Horários de Trabalho */}
                    <div style={{ marginTop: '20px', padding: '20px', background: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', textAlign: 'center' }}>🕒 Horário de Funcionamento</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '13px' }}>Início da Jornada</label>
                                <input
                                    type="time"
                                    value={formData.work_start}
                                    onChange={(e) => setFormData({ ...formData, work_start: e.target.value })}
                                    style={{ background: '#171717', border: '1px solid #2a2a2a', color: 'white', padding: '10px', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '13px' }}>Fim da Jornada</label>
                                <input
                                    type="time"
                                    value={formData.work_end}
                                    onChange={(e) => setFormData({ ...formData, work_end: e.target.value })}
                                    style={{ background: '#171717', border: '1px solid #2a2a2a', color: 'white', padding: '10px', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '13px' }}>Início do Intervalo</label>
                                <input
                                    type="time"
                                    value={formData.break_start}
                                    onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                                    style={{ background: '#171717', border: '1px solid #2a2a2a', color: 'white', padding: '10px', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '13px' }}>Fim do Intervalo</label>
                                <input
                                    type="time"
                                    value={formData.break_end}
                                    onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                                    style={{ background: '#171717', border: '1px solid #2a2a2a', color: 'white', padding: '10px', borderRadius: '8px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            backgroundColor: '#22c55e',
                            color: '#0d0d0d',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            transition: '0.2s'
                        }}
                    >
                        {saving ? "Salvando alterações..." : "Salvar Perfil e Horários"}
                    </button>
                </form>
            </div>
        </div>
    );
}
