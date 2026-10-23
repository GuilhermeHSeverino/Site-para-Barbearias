import "./avisoNotificacao.css";

// Aviso flutuante exibido quando chega uma notificação nova.
export default function AvisoNotificacao({ aviso, onAbrir, onFechar }) {
    if (!aviso) return null;
    return (
        <div className="aviso-notificacao" role="status">
            <button className="aviso-notificacao-texto" onClick={onAbrir}>
                <span aria-hidden="true">🔔</span> {aviso.message}
            </button>
            <button className="aviso-notificacao-fechar" onClick={onFechar} aria-label="Fechar aviso">
                ✕
            </button>
        </div>
    );
}

// Botão para o usuário permitir as notificações do navegador (só aparece enquanto ele não decidiu).
export function BotaoAtivarAvisos({ permissao, onAtivar, className = "" }) {
    if (permissao !== "default") return null;
    return (
        <button className={`botao-ativar-avisos ${className}`} onClick={onAtivar}>
            🔔 Ativar avisos no navegador
        </button>
    );
}
