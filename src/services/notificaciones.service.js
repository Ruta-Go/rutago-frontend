import api from "../api/axios";

const extraerError = (err, fallback) =>
  new Error(err.response?.data?.message || err.message || fallback);

export const notificacionesService = {
  listar: async () => {
    try {
      const res = await api.get("/notificaciones");
      return res.data?.data ?? [];
    } catch (err) {
      throw extraerError(err, "Error al cargar notificaciones");
    }
  },
  marcarLeida: async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leida`);
      return true;
    } catch (err) {
      throw extraerError(err, "Error al marcar la notificación como leída");
    }
  },
};
