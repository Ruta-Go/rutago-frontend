const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Deriva /ws desde la misma URL del backend. No se guarda ni se imprime el
 * token: viaja sólo en el query del handshake, igual que exige el backend.
 */
function construirUrlWebSocket() {
  const origen =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const absoluta = API_URL.startsWith("http") ? API_URL : `${origen}${API_URL}`;
  const raiz = absoluta.replace(/\/api\/?$/, "");
  return `${raiz.replace(/^http/, "ws")}/ws`;
}

export const WS_URL = construirUrlWebSocket();

export function conectarTiempoReal(token, sala, onEvento, onEstado) {
  if (!token || !sala) {
    onEstado?.("sin-token");
    return null;
  }

  const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ tipo: "suscribirse", sala }));
    onEstado?.("conectado");
  };

  socket.onmessage = (mensaje) => {
    try {
      const evento = JSON.parse(mensaje.data);
      if (evento.tipo === "error") {
        onEstado?.("rechazado");
        return;
      }
      onEvento(evento);
    } catch {
      // Mensaje inválido: se descarta, no se fabrica un evento.
    }
  };

  socket.onerror = () => {
    onEstado?.("sin-conexion");
  };

  socket.onclose = () => {
    onEstado?.("desconectado");
  };

  return socket;
}
