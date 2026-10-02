import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useState } from "react";
import { jwtDecode } from "jwt-decode"; // importa corretamente
import "./FormLogin.css";

function FormLogin({ route }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Faz login
      const res = await api.post(route, { username, password });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

      // Decodifica token para pegar user_id
      const decoded = jwtDecode(res.data.access);

      if (decoded.is_barber) {
        navigate("/barbeiro");
      } else {
        navigate("/cliente");
      }

    } catch (error) {
      console.error("Erro no login:", error);
      alert("Usuário ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <form onSubmit={handleSubmit} className="form-container p-5 rounded shadow">
        <h1 className="mb-4 text-center">Login</h1>
        <input
          type="text"
          className="form-input mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário ou Email"
        />
        <input
          type="password"
          className="form-input mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
        />
        <button className="form-button w-100 mb-3" type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Entrar"}
        </button>
        <div className="text-center">
          <span className="text-light">Não tem conta? </span>
          <Link to="/register" className="text-warning fw-bold">Cadastre-se aqui</Link>
        </div>
      </form>
    </div>
  );
}

export default FormLogin;
