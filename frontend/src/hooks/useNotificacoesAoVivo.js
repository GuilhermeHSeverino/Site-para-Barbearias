import { useEffect, useRef, useState } from "react";
import api from "../api";

const INTERVALO_MS = 30000;
// na primeira consulta, só avisa o que chegou há pouco (o restante já era conhecido)
const RECENTE_MS = 2 * 60 * 1000;

function notificarNoNavegador(mensagem, id) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
        new Notification("Barbearia", { body: mensagem, tag: `notificacao-${id}` });
    } catch {
        // alguns navegadores de celular só permitem notificações por service worker
    }
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
                    novas.slice(0, 3).forEach((n) => notificarNoNavegador(n.message, n.id));
                }
            } catch {
                // falha temporária de rede: tenta de novo no próximo ciclo
            }
        };

        verificar();
        const intervalo = window.setInterval(verificar, INTERVALO_MS);
        return () => {
            ativo = false;
            window.clearInterval(intervalo);
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
