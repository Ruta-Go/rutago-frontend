import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { conectarTiempoReal } from "../../api/tiempo-real";
import MapaFlota from "../../components/MapaFlota/MapaFlota";
import { vehiculosService } from "../../services/vehiculos.service";
import "./FlotaMapaPage.css";

const ETIQUETAS_CONEXION = {
  conectado: "Conectado al canal de vehículos",
  "sin-token": "Sin sesión para tiempo real",
  "sin-conexion": "Sin conexión en tiempo real",
  rechazado: "Canal rechazado por el servidor",
  desconectado: "Canal desconectado",
};

export default function FlotaMapaPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [posiciones, setPosiciones] = useState({});
  const [estadoConexion, setEstadoConexion] = useState("sin-conexion");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const respuesta = await vehiculosService.getAll({
        registrosPorPagina: 100,
      });
      const lista = respuesta?.data ?? [];
      setVehiculos(lista);

      const iniciales = {};
      lista.forEach((vehiculo) => {
        if (vehiculo.latitud == null || vehiculo.longitud == null) return;
        iniciales[vehiculo.id] = {
          ...vehiculo,
          latitud: Number(vehiculo.latitud),
          longitud: Number(vehiculo.longitud),
          enVivo: false,
        };
      });
      setPosiciones(iniciales);
    } catch (err) {
      setError(err.message || "Error al cargar la flota");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const salasVehiculos = useMemo(
    () =>
      vehiculos
        .filter((vehiculo) => vehiculo?.id)
        .map((vehiculo) => `vehiculo:${vehiculo.id}`),
    [vehiculos],
  );

  useEffect(() => {
    if (salasVehiculos.length === 0) return undefined;

    const socket = conectarTiempoReal(
      localStorage.getItem("token"),
      salasVehiculos,
      (evento) => {
        if (evento.tipo !== "ubicacion" || !evento.payload) return;
        const datos = evento.payload;
        if (
          datos.vehiculoId == null ||
          datos.latitud == null ||
          datos.longitud == null
        ) {
          return;
        }

        const vehiculoId = Number(datos.vehiculoId);
        setPosiciones((actuales) => {
          const anterior = actuales[vehiculoId] ?? {};
          return {
            ...actuales,
            [vehiculoId]: {
              ...anterior,
              ...datos,
              id: vehiculoId,
              latitud: Number(datos.latitud),
              longitud: Number(datos.longitud),
              placa: datos.placa ?? anterior.placa,
              ultimaActualizacion:
                datos.ultimaActualizacion ??
                evento.fecha ??
                anterior.ultimaActualizacion,
              enVivo: true,
            },
          };
        });
      },
      setEstadoConexion,
    );

    return () => socket?.close();
  }, [salasVehiculos]);

  const posicionesVisibles = useMemo(
    () =>
      Object.values(posiciones).filter(
        (p) => Number.isFinite(p.latitud) && Number.isFinite(p.longitud),
      ),
    [posiciones],
  );

  return (
    <div className="flota-page">
      <div className="flota-encabezado">
        <div>
          <h1>Mapa de flota</h1>
          <p className="flota-conexion">
            {ETIQUETAS_CONEXION[estadoConexion] || "Sin conexión en tiempo real"}
          </p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={() => navigate("/vehiculos")}
        >
          Volver a Vehículos
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <div className="flota-cargando">
          <div className="spinner" />
          <p>Cargando vehículos y últimas posiciones...</p>
        </div>
      ) : (
        <div className="flota-contenido">
          <section className="flota-mapa">
            <MapaFlota posiciones={posicionesVisibles} />
            <p className="flota-leyenda">
              <span className="punto verde" /> Actualizado por WebSocket
              <span className="punto gris" /> Último dato del REST
            </p>
            <p className="flota-nota">
              Sólo se muestran coordenadas reportadas. Si un vehículo nunca
              envió posición, aparece en la lista pero no se inventa un marcador.
            </p>
          </section>

          <aside className="flota-lista">
            <h2>Vehículos ({vehiculos.length})</h2>
            {vehiculos.length === 0 && (
              <p className="flota-vacio">No hay vehículos registrados.</p>
            )}
            {vehiculos.map((vehiculo) => {
              const posicion = posiciones[vehiculo.id];
              return (
                <div key={vehiculo.id} className="flota-item">
                  <div className="flota-item-titulo">
                    <strong>{vehiculo.placa || `Vehículo #${vehiculo.id}`}</strong>
                    {posicion?.enVivo && (
                      <span className="flota-chip">En vivo</span>
                    )}
                  </div>
                  <div className="flota-item-dato">
                    Estado: {vehiculo.estado?.nombre || "No disponible"}
                  </div>
                  <div className="flota-item-dato">
                    {posicion?.latitud != null && posicion?.longitud != null
                      ? `${Number(posicion.latitud).toFixed(5)}, ${Number(posicion.longitud).toFixed(5)}`
                      : "Sin coordenadas reportadas"}
                  </div>
                  {posicion?.ultimaActualizacion && (
                    <div className="flota-item-dato">
                      Actualizado:{" "}
                      {new Date(posicion.ultimaActualizacion).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>
        </div>
      )}
    </div>
  );
}
