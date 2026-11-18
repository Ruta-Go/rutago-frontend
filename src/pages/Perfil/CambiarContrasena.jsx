import { useState } from "react";
import { usuariosService } from "../../services/usuarios.service";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function CambiarContrasena() {
  const [formData, setFormData] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmacion: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!PASSWORD_REGEX.test(formData.nuevaContrasena)) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres, una letra y un número.",
      );
      return;
    }
    if (formData.nuevaContrasena !== formData.confirmacion) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const respuesta = await usuariosService.cambiarContrasenaPerfil({
        contrasenaActual: formData.contrasenaActual,
        nuevaContrasena: formData.nuevaContrasena,
      });
      setMensaje(respuesta.message || "Contraseña actualizada correctamente.");
      setFormData({
        contrasenaActual: "",
        nuevaContrasena: "",
        confirmacion: "",
      });
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-content">
      <div className="bg-white rounded-lg shadow-sm">
        <h2>Cambiar contraseña</h2>
        {mensaje && <div className="success-message">{mensaje}</div>}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="perfil-form">
          <label htmlFor="contrasenaActual">Contraseña actual</label>
          <PasswordInput
            id="contrasenaActual"
            name="contrasenaActual"
            value={formData.contrasenaActual}
            onChange={handleChange}
            placeholder="Contraseña actual"
            autoComplete="current-password"
            required
          />

          <label htmlFor="nuevaContrasena">Nueva contraseña</label>
          <PasswordInput
            id="nuevaContrasena"
            name="nuevaContrasena"
            value={formData.nuevaContrasena}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres, letra y número"
            autoComplete="new-password"
            required
          />

          <label htmlFor="confirmacionContrasena">Confirmar contraseña</label>
          <PasswordInput
            id="confirmacionContrasena"
            name="confirmacion"
            value={formData.confirmacion}
            onChange={handleChange}
            placeholder="Repite la nueva contraseña"
            autoComplete="new-password"
            required
          />

          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
