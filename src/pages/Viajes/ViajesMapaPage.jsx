import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MapaRutas from "../../components/MapaRutas/MapaRutas";
import { conectarTiempoReal } from "../../api/tiempo-real";
import { viajesService } from "../../services/viajes.service";
import { vehiculosService } from "../../services/vehiculos.service";

export default function ViajesMapaPage() {
  const { id } = useParams();
  const [viaje, setViaje] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [estadoTiempoReal, setEstadoTiempoReal] = useState("sin-conexion");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await viajesService.getById(id);
        const datos = data && data.data ? data.data : data;
        setViaje(datos);

        // La posición inicial viene del REST real. Si el vehículo nunca
        // reportó coordenadas, no se coloca un marcador inventado.
        const vehiculoId = datos?.vehiculo?.id;
        if (vehiculoId) {
          try {
            const posicion = await vehiculosService.getUbicacion(vehiculoId);
            if (posicion?.latitud != null && posicion?.longitud != null) {
              setUbicacion(posicion);
            }
          } catch {
            // No es un error del viaje: el mapa sigue mostrando la ruta real.
          }
        }
      } catch (err) {
        setError(err.message || "Error al cargar el viaje");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;

    const socket = conectarTiempoReal(
      localStorage.getItem("token"),
      `viaje:${id}`,
      (evento) => {
        if (evento.tipo !== "ubicacion") return;
        const datos = evento.payload ?? {};
        if (datos.latitud == null || datos.longitud == null) return;
        setUbicacion((anterior) => ({ ...anterior, ...datos }));
      },
      setEstadoTiempoReal,
    );

    return () => socket?.close();
  }, [id]);

  const ubicacionVisible = ubicacion
    ? { ...ubicacion, placa: ubicacion.placa || viaje?.vehiculo?.placa }
    : null;
  const etiquetaConexion = {
    conectado: "Conectado al canal del viaje",
    "sin-token": "Sin sesión para tiempo real",
    "sin-conexion": "Sin conexión en tiempo real",
    rechazado: "Canal rechazado por el servidor",
    desconectado: "Canal desconectado",
  }[estadoTiempoReal] || "Sin conexión en tiempo real";

  return (
    <div className="viajes-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Mapa del Viaje #{id}</h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
            {etiquetaConexion}
          </p>
        </div>
        <button
          onClick={() => navigate("/viajes")}
          className="button button-outline"
        >
          Volver a Viajes
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm" style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div className="loading-container" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div className="spinner"></div>
            <p>Cargando mapa...</p>
          </div>
        ) : !viaje?.ruta ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <p>Este viaje no tiene una ruta definida con coordenadas válidas.</p>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: "0.75rem" }}>
              {viaje.ruta.nombre}
            </h3>
            {ubicacionVisible && (
              <p style={{ marginTop: 0, fontSize: "0.85rem", color: "#374151" }}>
                Vehículo {ubicacionVisible.placa || "sin placa registrada"} ·
                actualizado{" "}
                {ubicacionVisible.ultimaActualizacion
                  ? new Date(ubicacionVisible.ultimaActualizacion).toLocaleString()
                  : "en una fecha no disponible"}
              </p>
            )}
            <div style={{ flex: 1, minHeight: "600px" }}>
              <MapaRutas
                rutas={[viaje.ruta]}
                vehiculoUbicacion={ubicacionVisible}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
