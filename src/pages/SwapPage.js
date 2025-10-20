import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { fmt } from "../utils/format";
import "./SwapPage.css";

function SwapPage() {
  const { id } = useParams();
  const { byId } = useData();
  const navigate = useNavigate();
  const item = byId(id);

  const [offer, setOffer] = useState({
    title: "",
    value: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!item) {
    return (
      <main className="container page swap-page">
        <section className="panel">
          <p className="muted">No encontramos el anuncio solicitado.</p>
          <button className="btn outline" type="button" onClick={() => navigate(-1)}>
            Volver
          </button>
        </section>
      </main>
    );
  }

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setField = (key, value) => {
    setOffer((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const validate = () => {
    const nextErrors = {};
    if (!offer.title.trim()) nextErrors.title = "Describe el artículo que ofreces.";
    if (!offer.value || Number(offer.value) <= 0)
      nextErrors.value = "Indica el valor estimado.";
    if (!offer.message.trim())
      nextErrors.message = "Cuenta por qué el intercambio conviene a ambas partes.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  return (
    <main className="container page swap-page">
      <section className="panel swap-summary">
        <button type="button" className="swap-back" onClick={() => navigate(-1)}>
          ◀ Volver
        </button>
        <h1 className="swap-title">Proponer intercambio</h1>
        <div className="swap-item">
          <img src={item.images?.[0] || "/images/placeholder.jpg"} alt={item.name} />
          <div>
            <h2>{item.name}</h2>
            <p className="muted">
              REF {fmt(item.price)} · {item.location}
            </p>
          </div>
        </div>
      </section>

      <section className="panel swap-form-panel">
        {!submitted ? (
          <form className="swap-form" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">¿Qué ofreces a cambio?</span>
              <input
                className={`input ${errors.title ? "input-error" : ""}`}
                value={offer.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Ej: Laptop Dell XPS 13 en excelente estado"
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </label>
            <label className="field">
              <span className="label">Valor estimado (REF)</span>
              <input
                className={`input ${errors.value ? "input-error" : ""}`}
                type="number"
                min="0"
                value={offer.value}
                onChange={(e) => setField("value", e.target.value)}
                placeholder="Ej: 800"
              />
              {errors.value && <span className="field-error">{errors.value}</span>}
            </label>
            <label className="field">
              <span className="label">Mensaje para el vendedor</span>
              <textarea
                className={`input ${errors.message ? "input-error" : ""}`}
                rows="5"
                maxLength={400}
                value={offer.message}
                onChange={(e) => setField("message", e.target.value)}
                placeholder="Explica el estado de tu artículo, accesorios incluidos y por qué el intercambio es justo."
              />
              <span className="field-hint">
                {400 - offer.message.length} caracteres disponibles
              </span>
              {errors.message && <span className="field-error">{errors.message}</span>}
            </label>
            <div className="swap-actions">
              <button type="submit" className="btn primary">
                Enviar propuesta
              </button>
            </div>
          </form>
        ) : (
          <div className="swap-confirmation">
            <h2>¡Propuesta enviada!</h2>
            <p>
              Hemos guardado tu oferta para <strong>{item.name}</strong>. Podrás
              continuar la conversación desde tu bandeja de entrada.
            </p>
            <div className="swap-actions">
              <button type="button" className="btn outline" onClick={() => navigate("/inbox")}>
                Ir a mensajes
              </button>
              <button type="button" className="btn primary" onClick={() => navigate("/")}>
                Explorar más artículos
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default SwapPage;
