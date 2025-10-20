import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { CATALOG } from "../utils/constants";
import Select from "../components/Select/Select";
import "../styles/AuthPages.css";

const strengthLabels = ["Muy débil", "Débil", "Aceptable", "Segura", "Fuerte"];

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, strengthLabels.length - 1);
}

function RegisterPage() {
  const { register: registerUser, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const next = params.get("next") || "/";

  useEffect(() => {
    if (user) nav(next);
  }, [user, nav, next]);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const locationOptions = useMemo(() => {
    const set = new Set();
    Object.values(CATALOG).forEach((cat) => {
      (cat.locations || []).forEach((loc) => set.add(loc));
    });
    return Array.from(set).sort();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !username.trim()) {
      setError("Indica tu nombre completo y un usuario.");
      return;
    }
    if (!email.trim() || !location) {
      setError("Completa todos los campos requeridos.");
      return;
    }
    if (password.length < 8) {
      setError("La clave debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las claves no coinciden.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los términos para continuar.");
      return;
    }
    const result = registerUser({
      email,
      password,
      name: fullName,
      location,
      username,
      phone,
    });
    if (!result?.success) {
      setError(result?.error || "No se pudo crear la cuenta.");
      return;
    }
    nav(next);
  };

  const score = password ? passwordScore(password) : 0;

  return (
    <main className="container page auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo" aria-hidden>
            <span className="auth-logo-symbol">⇄</span>
            <span className="auth-logo-text">peloAPPelo</span>
          </div>
          <h1 className="auth-title">Únete a peloAPPelo</h1>
          <p className="auth-subtitle">
            Crea tu cuenta para comenzar a intercambiar.
          </p>
        </header>

        <div className="auth-social">
          <button type="button" className="btn outline sm auth-social-btn">
            <FaGoogle aria-hidden />
            Continuar con Google
          </button>
          <button type="button" className="btn outline sm auth-social-btn">
            <FaFacebookF aria-hidden />
            Continuar con Facebook
          </button>
        </div>

        <div className="auth-divider">
          <span>o completa el formulario</span>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-fullname">
              Nombre completo
            </label>
            <input
              id="register-fullname"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ingresa tu nombre y apellido"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-username">
              Usuario
            </label>
            <input
              id="register-username"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Elige tu usuario"
              required
            />
            <small className="auth-hint">
              Usa letras y números sin espacios (ej. juanperez01)
            </small>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-phone">
              Teléfono
            </label>
            <input
              id="register-phone"
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+58 000 0000000"
            />
          </div>

          <Select
            label="Estado"
            name="register_location"
            value={location}
            onChange={setLocation}
            placeholder="Selecciona tu estado"
            options={locationOptions.map((loc) => ({
              value: loc,
              label: loc,
            }))}
            required
            className="auth-select"
          />

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">
              Clave
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-password"
                className="auth-input"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave"
                minLength={8}
                required
              />
              <button
                type="button"
                className="auth-input-append"
                onClick={() => setPasswordVisible((v) => !v)}
                aria-label={passwordVisible ? "Ocultar clave" : "Mostrar clave"}
              >
                {passwordVisible ? (
                  <FaEyeSlash aria-hidden />
                ) : (
                  <FaEye aria-hidden />
                )}
              </button>
            </div>
            {password && (
              <div
                className={`auth-password-meter score-${score}`}
                aria-live="polite"
              >
                <span className="auth-password-indicator" />
                <span className="auth-password-label">
                  {strengthLabels[score]}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-confirm">
              Confirmar clave
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-confirm"
                className="auth-input"
                type={confirmVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu clave"
                minLength={8}
                required
              />
              <button
                type="button"
                className="auth-input-append"
                onClick={() => setConfirmVisible((v) => !v)}
                aria-label={
                  confirmVisible ? "Ocultar confirmación" : "Mostrar confirmación"
                }
              >
                {confirmVisible ? (
                  <FaEyeSlash aria-hidden />
                ) : (
                  <FaEye aria-hidden />
                )}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span className="field-error">Las claves deben coincidir.</span>
            )}
          </div>

          <label className="auth-terms">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
            />
            <span>
              Acepto los{" "}
              <button type="button" className="auth-link">
                Términos de servicio
              </button>{" "}
              y la{" "}
              <button type="button" className="auth-link">
                Política de privacidad
              </button>
              .
            </span>
          </label>

          {error && (
            <div className="field-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn primary" type="submit">
            Crear cuenta
          </button>
        </form>

        <footer className="auth-footer">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="auth-link">
            Inicia sesión
          </Link>
        </footer>
      </div>
    </main>
  );
}

export default RegisterPage;
