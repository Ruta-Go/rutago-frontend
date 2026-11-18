import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usuariosService } from "../../services/usuarios.service";
import Input from "../../components/Input/Input";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import "./RecuperarPassword.css";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function RecuperarPassword() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const esRestablecimiento = Boolean(token);

  const [correo, setCorreo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSolicitud = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");
    setError("");

    try {
      await usuariosService.solicitarRecuperacion(correo);
      setMensaje("Si el correo está registrado, recibirás instrucciones.");
    } catch (err) {
      // El backend no revela si el correo existe; sólo informa fallos de entrega.
      setError(err.message || "No se pudo solicitar la recuperación.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecimiento = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!PASSWORD_REGEX.test(nuevaContrasena)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
      );
      return;
    }
    if (nuevaContrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const respuesta = await usuariosService.cambiarContrasenaConToken(
        token,
        nuevaContrasena,
      );
      setMensaje(respuesta.message || "Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message || "El enlace no es válido o ya expiró.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card
        title={
          esRestablecimiento
            ? "Restablecer contraseña"
            : "Recuperar Contraseña"
        }
      >
        <p className="description">
          {esRestablecimiento
            ? "Elige una nueva contraseña para acceder a RutaGo."
            : "Introduce tu correo y te enviaremos instrucciones."}
        </p>
        {mensaje && <p className="status-message">{mensaje}</p>}
        {error && <p className="error-message">{error}</p>}

        {esRestablecimiento ? (
          <form
            onSubmit={handleRestablecimiento}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label htmlFor="nuevaContrasena">Nueva contraseña</label>
              <PasswordInput
                id="nuevaContrasena"
                name="nuevaContrasena"
                placeholder="Mínimo 8 caracteres, letra y número"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmacion">Confirmar contraseña</label>
              <PasswordInput
                id="confirmacion"
                name="confirmacion"
                placeholder="Repite la nueva contraseña"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleSolicitud}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Input
              name="correo"
              label="Correo"
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </Button>
          </form>
        )}

        <div className="login-links">
          <Link to="/login">Volver al inicio</Link>
        </div>
      </Card>
    </div>
  );
}

export default RecuperarPassword;
