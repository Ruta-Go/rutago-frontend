import { useCallback, useEffect, useRef, useState } from "react";

import { conectarTiempoReal } from "../../api/tiempo-real";
import { notificacionesService } from "../../services/notificaciones.service";
import "./NotificacionesCampana.css";

function fechaLegible(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function NotificacionesCampana({ user }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef(null);

  const cargar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setCargando(true);
      setNotificaciones(await notificacionesService.listar());
    } catch (err) {
      console.error("[notificaciones]", err.message);
    } finally {
      setCargando(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = conectarTiempoReal(
      localStorage.getItem("token"),
      `usuario:${user.id}`,
      (evento) => {
        if (
          evento.tipo === "notificacion" ||
          evento.tipo === "notificacion_leida"
        ) {
          void cargar();
        }
      },
    );

    return () => socket?.close();
  }, [user?.id, cargar]);

  useEffect(() => {
    const cerrarAlHacerClicFuera = (evento) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target)
      ) {
        setAbierta(false);
      }
    };
    document.addEventListener("mousedown", cerrarAlHacerClicFuera);
    return () =>
      document.removeEventListener("mousedown", cerrarAlHacerClicFuera);
  }, []);

  const marcarLeida = async (notificacion) => {
    try {
      await notificacionesService.marcarLeida(notificacion.id);
      await cargar();
    } catch (err) {
      console.error("[notificaciones]", err.message);
    }
  };

  if (!user?.id) return null;

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="notificaciones-campana" ref={contenedorRef}>
      <button
        type="button"
        className="notificaciones-boton"
        onClick={() => setAbierta((valor) => !valor)}
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
      >
        <span aria-hidden="true">🔔</span>
        {noLeidas > 0 && (
          <span className="notificaciones-badge">{noLeidas}</span>
        )}
      </button>

      {abierta && (
        <div className="notificaciones-panel">
          <div className="notificaciones-encabezado">
            <strong>Notificaciones</strong>
            <span>{noLeidas} sin leer</span>
          </div>

          {cargando && (
            <p className="notificaciones-vacio">Consultando avisos reales...</p>
          )}

          {!cargando && notificaciones.length === 0 && (
            <p className="notificaciones-vacio">
              No tienes notificaciones registradas.
            </p>
          )}

          <div className="notificaciones-lista">
            {!cargando &&
              notificaciones.map((notificacion) => (
                <div
                  key={notificacion.id}
                  className={`notificacion-item${notificacion.leida ? "" : " no-leida"}`}
                >
                  <div className="notificacion-titulo">
                    {notificacion.titulo || "Aviso de RutaGo"}
                  </div>
                  <div className="notificacion-mensaje">
                    {notificacion.mensaje || "Sin detalle"}
                  </div>
                  <div className="notificacion-pie">
                    <span>{fechaLegible(notificacion.createdAt)}</span>
                    {!notificacion.leida && (
                      <button
                        type="button"
                        onClick={() => void marcarLeida(notificacion)}
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
