import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import api from "../../api";
import "./barberLayout.css";

const LINKS = [
    { nome: "Início", icone: "🏠", rota: "/barbeiro/" },
    { nome: "Agenda", icone: "📅", rota: "/barbeiro/agenda" },
    { nome: "Clientes", icone: "👥", rota: "/barbeiro/clientes" },
    { nome: "Serviços", icone: "✂️", rota: "/barbeiro/servicos" },
    { nome: "Estoque", icone: "📦", rota: "/barbeiro/estoque" },
    { nome: "Financeiro", icone: "💰", rota: "/barbeiro/financas" },
    { nome: "Feedbacks", icone: "⭐", rota: "/barbeiro/feedbacks" },
    { nome: "Notificações", icone: "🔔", rota: "/barbeiro/notificacoes" },
    { nome: "Perfil público", icone: "👤", rota: "/barbeiro/perfil-publico" },
    { nome: "Configurações", icone: "⚙️", rota: "/barbeiro/configuracoes" },
];

export default function BarberLayout({ children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const [perfil, setPerfil] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const token = localStorage.getItem(ACCESS_TOKEN);
    let email = "";
    try {
        email = token ? jwtDecode(token).email : "";
    } catch {
        email = "";
    }

    useEffect(() => {
        api.get("/api/v1/profile/update/")
            .then((res) => setPerfil(res.data))
            .catch((error) => console.error("Erro ao carregar perfil do barbeiro:", error));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        navigate("/login");
    };

    const irPara = (rota) => {
        setMenuAberto(false);
        navigate(rota);
    };

    const linkAtual = LINKS.find(l => l.rota === location.pathname);

    return (
        <div className="barber-layout">

            {/* TOPBAR (só aparece no mobile/tablet) */}
            <div className="barber-topbar">
                <button
                    className="botao-hamburguer"
                    onClick={() => setMenuAberto(true)}
                    aria-label="Abrir menu"
                >
                    ☰
                </button>
                <span className="topbar-logo">💈 Barbearia</span>
            </div>

            {/* BACKDROP (mobile, quando o menu está aberto) */}
            {menuAberto && (
                <div className="sidebar-backdrop" onClick={() => setMenuAberto(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`barber-sidebar ${menuAberto ? "aberta" : ""}`}>
                <div className="sidebar-topo">
                    <span className="sidebar-logo">💈 Barbearia</span>
                    <button
                        className="botao-fechar"
                        onClick={() => setMenuAberto(false)}
                        aria-label="Fechar menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {LINKS.map((link) => {
                        const ativo = location.pathname === link.rota;
                        return (
                            <button
                                key={link.rota}
                                className={`sidebar-link ${ativo ? "ativo" : ""}`}
                                onClick={() => irPara(link.rota)}
                            >
                                <span className="sidebar-icone">{link.icone}</span>
                                {link.nome}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-rodape">
                    <button
                        className={`sidebar-usuario ${location.pathname === "/barbeiro/configuracoes" ? "perfil-ativo" : ""}`}
                        onClick={() => irPara("/barbeiro/configuracoes")}
                        title="Abrir meu perfil"
                    >
                        <span className="usuario-avatar">
                            {(perfil?.name || email || "?")[0].toUpperCase()}
                        </span>
                        <span className="usuario-dados">
                            <strong>{perfil?.name || "Meu perfil"}</strong>
                            <small>{email}</small>
                        </span>
                    </button>
                    <button className="sidebar-logout" onClick={handleLogout}>
                        Sair
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO */}
            <main className="barber-conteudo">
                {/* CABEÇALHO DINÂMICO - Agora alinhado com o conteúdo das páginas */}
                {linkAtual && linkAtual.rota !== "/barbeiro/" && (
                    <div style={{ width: '95%', maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{
                            padding: '24px 0',
                            marginBottom: '24px',
                            borderBottom: '1px solid #232323',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '24px' }}>{linkAtual.icone}</span>
                            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>
                                {linkAtual.nome}
                            </h1>
                        </div>
                    </div>
                )}
                {children}
            </main>

        </div>
    );
}