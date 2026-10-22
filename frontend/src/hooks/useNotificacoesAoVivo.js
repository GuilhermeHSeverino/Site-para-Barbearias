import { useEffect, useRef, useState } from "react";
import api from "../api";
import { notificarNavegador } from "../utils/notificarNavegador";

const INTERVALO_MS = 30000;
// na primeira consulta, só avisa o que chegou há pouco (o restante já era conhecido)
const RECENTE_MS = 2 * 60 * 1000;
const EVENTO_ATUALIZADAS = "notificacoes-atualizadas";

// Chamado pelas telas que marcam notificações como lidas, para o contador do sino atualizar na hora.
export function avisarNotificacoesAtualizadas() {
    window.dispatchEvent(new Event(EVENTO_ATUALIZADAS));
}

// Consulta as notificações periodicamente e informa o total não lido e a mais recente que chegou.
export default function useNotificacoesAoVivo(endpoint) {
    const [naoLidas, setNaoLidas] = useState(0);
    const [aviso, setAviso] = useState(null);
    const [permissao, setPermissao] = useState(
        typeof Notification !== "undefined" ? Notification.permission : "unsupported"
    );
    const conhecidas = useRef(null);

    useEffect(() => {
        let ativo = true;

        const verificar = async () => {
            try {
                const { data } = await api.get(endpoint);
                if (!ativo) return;
                const pendentes = data.filter((n) => !n.is_read);
                setNaoLidas(pendentes.length);

                const primeiraConsulta = conhecidas.current === null;
                const vistas = conhecidas.current || new Set();
                const novas = pendentes.filter((n) => !vistas.has(n.id) &&
                    (!primeiraConsulta || Date.now() - new Date(n.created_at).getTime() < RECENTE_MS));
                data.forEach((n) => vistas.add(n.id));
                conhecidas.current = vistas;

                if (novas.length) {
                    setAviso(novas[0]);
                    novas.slice(0, 3).forEach((n) => notificarNavegador("Barbearia", n.message, `notificacao-${n.id}`));
                }
            } catch {
                // falha temporária de rede: tenta de novo no próximo ciclo
            }
        };

        verificar();
        const intervalo = window.setInterval(verificar, INTERVALO_MS);
        window.addEventListener(EVENTO_ATUALIZADAS, verificar);
        return () => {
            ativo = false;
            window.clearInterval(intervalo);
            window.removeEventListener(EVENTO_ATUALIZADAS, verificar);
        };
    }, [endpoint]);

    // o aviso na tela some sozinho depois de alguns segundos
    useEffect(() => {
        if (!aviso) return;
        const timeout = window.setTimeout(() => setAviso(null), 8000);
        return () => window.clearTimeout(timeout);
    }, [aviso]);

    const pedirPermissao = async () => {
        if (typeof Notification === "undefined") return;
        setPermissao(await Notification.requestPermission());
    };

    return { naoLidas, aviso, fecharAviso: () => setAviso(null), permissao, pedirPermissao };
}
