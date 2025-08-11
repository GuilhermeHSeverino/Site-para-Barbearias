import { useNavigate, Link } from 'react-router-dom';
import api from "../api"
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import { useState } from 'react';

// import "../styles/Form.css";


function FormLogin({ route }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const res = await api.post(route, { username, password });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      if (res.data.isSuperuser) {
        navigate("/barbeiro");
      } else {
        navigate("/cliente");
      }

    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>Login</h1>
      <input
        type="text"
        className="form-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder='Username'
      />
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Carregando..." : "Entrar"}
      </button>
    </form>

  )
}

export default FormLogin
