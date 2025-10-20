import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthPages.css";

function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const next = params.get("next") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (user) nav(next);
  }, [user, nav, next]);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Ingresa tu usuario o correo y tu clave.");
      return;
    }
    const result = login({ identifier, password });
    if (!result?.success) {
      setError(result?.error || "No se pudo iniciar sesión.");
      return;
    }
  };

  return (
    <main className="container page auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo" aria-hidden>
            <span className="auth-logo-symbol">⇄</span>
            <span className="auth-logo-text">peloAPPelo</span>
          </div>
          <h1 className="auth-title">¡Hola de nuevo!</h1>
          <p className="auth-subtitle">
            Inicia sesión para continuar tu experiencia de intercambio.
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
          <span>o ingresa tus datos</span>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-identifier">
              Usuario o email
            </label>
            <input
              id="login-identifier"
              className="auth-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ingresa tu usuario o correo"
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Clave
            </label>
            <div className="auth-input-wrapper">
              <input
                id="login-password"
                className="auth-input"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave"
                autoComplete="current-password"
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
            <button type="button" className="auth-link auth-forgot">
              ¿Olvidaste tu clave?
            </button>
          </div>

          {error && (
            <div className="field-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn primary" type="submit">
            Ingresar
          </button>
        </form>

        <footer className="auth-footer">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="auth-link">
            Regístrate
          </Link>
        </footer>
      </div>
    </main>
  );
}

export default LoginPage;
