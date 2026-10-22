// Mostra uma notificação do navegador sem nunca derrubar a tela.
// No Chrome do Android o construtor `new Notification()` é proibido: lá a notificação
// precisa sair pelo service worker (public/sw.js), registrado em main.jsx.
export async function notificarNavegador(titulo, corpo, tag) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
        const registro = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
        if (registro) {
            await registro.showNotification(titulo, { body: corpo, tag, icon: "/favicon.ico" });
            return;
        }
        new Notification(titulo, { body: corpo, tag, icon: "/favicon.ico" });
    } catch {
        // navegador sem suporte: o aviso dentro do sistema continua aparecendo
    }
}
