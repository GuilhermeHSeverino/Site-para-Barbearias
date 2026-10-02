import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/auth.css";

export default function Register() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/api/v1/authentication/register/", form);
            navigate("/login", { state: { registered: true } });
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Não foi possível criar sua conta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-showcase"><span>💈</span><p>Seu estilo, no seu tempo.</p><h1>Uma cadeira.<br />Um cuidado pensado para você.</h1><small>Agende, acompanhe e viva uma experiência mais simples na sua barbearia.</small></section>
            <section className="auth-panel"><div className="auth-form-wrap"><span className="auth-kicker">Criar conta</span><h2>Comece sua jornada</h2><p className="auth-subtitle">Tenha seus agendamentos e pedidos sempre por perto.</p>{error && <div className="auth-error">{error}</div>}<form onSubmit={submit}><label>Nome completo<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Como podemos chamar você?" /></label><label>E-mail<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" /></label><label>Telefone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></label><label>Senha<input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo de 6 caracteres" /></label><button className="auth-submit" disabled={loading}>{loading ? "Criando conta..." : "Criar minha conta"}</button></form><p className="auth-switch">Já tem uma conta? <Link to="/login">Entrar</Link></p></div></section>
        </main>
    );
}
