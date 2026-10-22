import "./avisoNotificacao.css";

// Sino da barra superior (celular) com a quantidade de notificações não lidas.
export default function IconeNotificacoes({ naoLidas, onClick }) {
    const texto = naoLidas > 9 ? "9+" : naoLidas;
    return (
        <button
            className="icone-notificacoes"
            onClick={onClick}
            aria-label={naoLidas ? `${naoLidas} notificações não lidas` : "Notificações"}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {naoLidas > 0 && <span className="icone-notificacoes-bolinha">{texto}</span>}
        </button>
    );
}

// Etiqueta discreta com a quantidade, usada ao lado do item do menu lateral.
export function ContadorMenu({ naoLidas }) {
    if (!naoLidas) return null;
    return <span className="contador-menu">{naoLidas > 99 ? "99+" : naoLidas}</span>;
}
