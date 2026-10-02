import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import "./clienteLayout.css";

const LINKS = [
    { nome: "Início", icone: "⌂", rota: "/cliente" },
    { nome: "Agendar", icone: "＋", rota: "/cliente/agendar" },
    { nome: "Agendamentos", icone: "◷", rota: "/cliente/historico" },
    { nome: "Loja", icone: "◇", rota: "/cliente/loja" },
    { nome: "Meus pedidos", icone: "▣", rota: "/cliente/pedidos" },
    { nome: "Avaliar", icone: "★", rota: "/cliente/feedback" },
];

export default function ClienteLayout({ children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem(ACCESS_TOKEN);
    let email = "";

    try {
        email = token ? jwtDecode(token).email || "" : "";
    } catch {
        email = "";
    }

    const irPara = (rota) => {
        setMenuAberto(false);
        navigate(rota);
    };

    const sair = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        navigate("/login");
    };

    return (
        <div className="cliente-layout">
            <div className="cliente-topbar">
                <button className="cliente-menu-botao" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
                <span className="cliente-logo">💈 Barbearia</span>
            </div>

            {menuAberto && <div className="cliente-backdrop" onClick={() => setMenuAberto(false)} />}

            <aside className={`cliente-sidebar ${menuAberto ? "aberta" : ""}`}>
                <div className="cliente-sidebar-topo">
                    <span className="cliente-logo">💈 Barbearia</span>
                    <button className="cliente-fechar" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">✕</button>
                </div>

                <nav className="cliente-nav">
                    {LINKS.map((link) => (
                        <button
                            key={link.rota}
                            className={`cliente-nav-link ${location.pathname === link.rota ? "ativo" : ""}`}
                            onClick={() => irPara(link.rota)}
                        >
                            <span>{link.icone}</span>
                            {link.nome}
                        </button>
                    ))}
                </nav>

                <div className="cliente-sidebar-rodape">
                    <button className="cliente-identidade" onClick={() => irPara("/cliente") } title="Voltar ao início">
                        <span className="cliente-avatar">{email ? email[0].toUpperCase() : "C"}</span>
                        <span className="cliente-identidade-texto">
                            <strong>Minha conta</strong>
                            <small>{email || "Cliente"}</small>
                        </span>
                    </button>
                    <button className="cliente-sair" onClick={sair}>Sair</button>
                </div>
            </aside>

            <main className="cliente-conteudo">
                {location.pathname !== "/cliente" && (
                    <div className="cliente-titulo-pagina">
                        <span>{LINKS.find((link) => link.rota === location.pathname)?.icone || "•"}</span>
                        <h1>{LINKS.find((link) => link.rota === location.pathname)?.nome || "Área do cliente"}</h1>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
