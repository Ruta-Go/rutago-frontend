import { useEffect } from "react";
import { MapContainer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BUENAVENTURA_CENTER, MAP_STYLES } from "../../config/mapas";

function svgMarkerIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="32" viewBox="0 0 20 32"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 22 10 22s10-14.5 10-22C20 4.5 15.5 0 10 0Z" fill="${color}" stroke="#fff" stroke-width="1.2"/><circle cx="10" cy="10" r="4" fill="#fff" opacity="0.9"/></svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
  });
}

function TileLayerSwitcher() {
  const map = useMap();

  useEffect(() => {
    const layers = {};
    const firstKey = Object.keys(MAP_STYLES)[0];
    layers[firstKey] = L.tileLayer(MAP_STYLES[firstKey].url, {
      attribution: MAP_STYLES[firstKey].attr,
    }).addTo(map);

    Object.entries(MAP_STYLES)
      .slice(1)
      .forEach(([name, cfg]) => {
        layers[name] = L.tileLayer(cfg.url, { attribution: cfg.attr });
      });

    const control = L.control
      .layers(layers, null, { position: "bottomleft", collapsed: false })
      .addTo(map);

    return () => {
      map.removeControl(control);
      Object.values(layers).forEach((capa) => map.removeLayer(capa));
    };
  }, [map]);

  return null;
}

function AjustarVista({ posiciones }) {
  const map = useMap();

  useEffect(() => {
    if (posiciones.length === 0) return;
    if (posiciones.length === 1) {
      map.setView(
        [posiciones[0].latitud, posiciones[0].longitud],
        Math.max(map.getZoom(), 15),
      );
      return;
    }
    map.fitBounds(
      L.latLngBounds(
        posiciones.map((p) => [p.latitud, p.longitud]),
      ).pad(0.2),
    );
  }, [map, posiciones]);

  return null;
}

export default function MapaFlota({ posiciones = [] }) {
  const visibles = posiciones.filter((p) =>
    Number.isFinite(p.latitud) && Number.isFinite(p.longitud),
  );

  return (
    <MapContainer
      center={BUENAVENTURA_CENTER}
      zoom={13}
      style={{ height: "520px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayerSwitcher />
      <AjustarVista posiciones={visibles} />
      {visibles.length === 0 && (
        <Marker position={BUENAVENTURA_CENTER}>
          <Popup>
            No hay vehículos con coordenadas reportadas en este momento.
          </Popup>
        </Marker>
      )}
      {visibles.map((vehiculo) => (
        <Marker
          key={vehiculo.id}
          position={[vehiculo.latitud, vehiculo.longitud]}
          icon={svgMarkerIcon(vehiculo.enVivo ? "#2ecc71" : "#95a5a6")}
        >
          <Popup>
            <b>{vehiculo.placa || `Vehículo #${vehiculo.id}`}</b>
            <br />
            Origen: {vehiculo.enVivo ? "WebSocket en vivo" : "último dato del REST"}
            <br />
            Latitud: {vehiculo.latitud.toFixed(5)}
            <br />
            Longitud: {vehiculo.longitud.toFixed(5)}
            <br />
            Actualizado:{" "}
            {vehiculo.ultimaActualizacion
              ? new Date(vehiculo.ultimaActualizacion).toLocaleString()
              : "fecha no disponible"}
          </Popup>
          <Tooltip permanent direction="top" className="ruta-tooltip">
            {vehiculo.placa || `#${vehiculo.id}`}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
