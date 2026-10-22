// Service worker mínimo: permite mostrar notificações no Chrome do Android.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ao tocar na notificação, volta para a aba do sistema (ou abre uma nova)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abas) => {
            if (abas.length) return abas[0].focus();
            return self.clients.openWindow("/");
        })
    );
});
