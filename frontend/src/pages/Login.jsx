import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import "../styles/auth.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.registered) setError("Conta criada. Agora entre com seu e-mail e senha.");
  }, [location.state]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/v1/authentication/token/", form);
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      const decoded = jwtDecode(res.data.access);
      navigate(decoded.is_barber ? "/barbeiro/" : "/cliente");
    } catch {
      setError("Não conseguimos entrar. Confira seu e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-showcase"><span>💈</span><p>Bem-vindo de volta</p><h1>Seu próximo corte começa aqui.</h1><small>Uma experiência simples para encontrar seu horário, cuidar do seu estilo e voltar quando quiser.</small></section><section className="auth-panel"><div className="auth-form-wrap"><span className="auth-kicker">Acessar conta</span><h2>Entrar</h2><p className="auth-subtitle">Acesse seus horários e novidades da barbearia.</p>{error && <div className="auth-error">{error}</div>}<form onSubmit={submit}><label>E-mail ou usuário<input autoFocus required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="voce@email.com" /></label><label>Senha<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Sua senha" /></label><button className="auth-submit" disabled={loading}>{loading ? "Entrando..." : "Entrar na conta"}</button></form><p className="auth-switch">Ainda não tem conta? <Link to="/register">Criar cadastro</Link></p></div></section></main>;
}