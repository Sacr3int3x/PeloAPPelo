import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { createSwapProposal } from "../services/transactions";
import VerificationRequiredModal from "../components/VerificationRequiredModal/VerificationRequiredModal";
import { fmt } from "../utils/format";
import {
  MdArrowBack,
  MdImage,
  MdClose,
  MdAttachMoney,
  MdSwapHoriz,
  MdCheckCircle,
  MdInbox,
  MdExplore,
  MdBlock,
  MdAdd,
  MdTrendingUp,
} from "react-icons/md";
import "./SwapPage.css";

function SwapPage() {
  const { id } = useParams();
  const { byId } = useData();
  const navigate = useNavigate();
  const auth = useAuth();
  const item = byId(id);
  const isVerified = auth.user?.verificationStatus === "approved";

  const [offer, setOffer] = useState({
    title: "",
    value: "",
    message: "",
    cashType: "none", // 'none', 'add', 'request'
    cashAmount: 0,
    images: [], // Array de data URLs de las imágenes
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  if (!item) {
    return (
      <main className="container page swap-page">
        <section className="panel">
          <p className="muted">No encontramos el anuncio solicitado.</p>
          <button
            className="btn outline"
            type="button"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </section>
      </main>
    );
  }

  const suggestedCash = Math.max(2500, Math.round(item.price * 0.25));

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limitar a 5 imágenes máximo
    const remainingSlots = 5 - offer.images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setOffer((prev) => ({
            ...prev,
            images: [...prev.images, reader.result],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setOffer((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!offer.title.trim())
      nextErrors.title = "Describe el artículo que ofreces.";
    if (!offer.value || Number(offer.value) <= 0)
      nextErrors.value = "Indica el valor estimado.";
    if (
      offer.cashType !== "none" &&
      (!offer.cashAmount || offer.cashAmount <= 0)
    )
      nextErrors.cashAmount = "Indica el monto en efectivo.";
    if (!offer.message.trim())
      nextErrors.message =
        "Cuenta por qué el intercambio conviene a ambas partes.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Refrescar sesión antes de enviar
      if (auth.refresh) {
        await auth.refresh();
      }
      // Obtener el token actualizado del contexto
      const latestToken =
        typeof auth.token === "function" ? auth.token() : auth.token;
      console.log("Token usado para intercambio:", latestToken);
      const proposal = {
        offeredItem: {
          description: offer.title,
          value: Number(offer.value),
          images: offer.images, // Agregar las imágenes
        },
        message: offer.message,
        cashAmount: offer.cashType !== "none" ? Number(offer.cashAmount) : 0,
        cashDirection:
          offer.cashType === "add"
            ? "toSeller"
            : offer.cashType === "request"
              ? "toBuyer"
              : "none",
      };

      await createSwapProposal(item.id, proposal, latestToken);
      setSubmitted(true);
    } catch (error) {
      console.error("Error al enviar la propuesta:", error);
      setErrors((prev) => ({
        ...prev,
        submit:
          "Hubo un error al enviar tu propuesta. Por favor, inicia sesión nuevamente si el problema persiste.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container page swap-page">
      <section className="swap-header">
        <button
          type="button"
          className="swap-back-btn"
          onClick={() => navigate(-1)}
        >
          <MdArrowBack />
        </button>
        <h1 className="swap-title">Proponer intercambio</h1>
      </section>

      {!isVerified && (
        <section className="panel verification-banner">
          <div className="verification-banner-content">
            <div className="verification-banner-icon">🔒</div>
            <div className="verification-banner-text">
              <h3>Verificación requerida</h3>
              <p>
                Para proponer intercambios, necesitas verificar tu identidad.
                Esto ayuda a mantener la plataforma segura.
              </p>
            </div>
            <button
              className="btn primary"
              onClick={() => navigate("/profile")}
            >
              Verificar identidad
            </button>
          </div>
        </section>
      )}

      <section className="swap-item-card">
        <div className="swap-item-badge">Artículo solicitado</div>
        <div className="swap-item-content">
          <img
            src={item.images?.[0] || "/images/placeholder.jpg"}
            alt={item.name}
            className="swap-item-image"
          />
          <div className="swap-item-info">
            <h2 className="swap-item-name">{item.name}</h2>
            <div className="swap-item-details">
              <span className="swap-item-price">
                <MdAttachMoney />
                {fmt(item.price)}
              </span>
              <span className="swap-item-location">{item.location}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="swap-form-section">
        {!submitted ? (
          <form className="swap-form" onSubmit={onSubmit}>
            <div className="swap-offer-header">
              <h3>¿Qué ofreces a cambio?</h3>
            </div>

            <div className="swap-form-group">
              <label htmlFor="swap-title" className="swap-label">
                Descripción del artículo *
              </label>
              <input
                id="swap-title"
                type="text"
                value={offer.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Ej: Laptop Dell XPS 13 en excelente estado"
                className={`swap-input ${errors.title ? "input-error" : ""}`}
              />
              {errors.title && (
                <span className="field-error">{errors.title}</span>
              )}
            </div>

            <div className="swap-form-group">
              <label htmlFor="swap-value" className="swap-label">
                <MdAttachMoney />
                Valor estimado (REF) *
              </label>
              <div className="swap-input-with-icon">
                <span className="input-icon">$</span>
                <input
                  id="swap-value"
                  type="number"
                  min="0"
                  value={offer.value}
                  onChange={(e) => setField("value", e.target.value)}
                  placeholder="Ej: 800"
                  className={`swap-input ${errors.value ? "input-error" : ""}`}
                />
              </div>
              {errors.value && (
                <span className="field-error">{errors.value}</span>
              )}
            </div>

            <div className="swap-form-group">
              <label className="swap-label">
                <MdImage />
                Imágenes de tu artículo ({offer.images.length}/5)
              </label>
              <div className="swap-images-upload">
                {offer.images.map((img, index) => (
                  <div key={index} className="swap-image-preview">
                    <img src={img} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="swap-image-remove"
                      onClick={() => removeImage(index)}
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
                {offer.images.length < 5 && (
                  <label className="swap-image-add">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                    <MdImage />
                    <span>Agregar foto</span>
                  </label>
                )}
              </div>
              <p className="swap-hint">
                Agrega hasta 5 fotos de tu artículo para que el vendedor pueda
                evaluarlo mejor
              </p>
            </div>

            <div className="swap-cash-section">
              <label className="swap-label">Efectivo en el intercambio</label>
              <div className="swap-cash-options">
                <button
                  type="button"
                  className={`swap-cash-btn ${offer.cashType === "none" ? "active" : ""}`}
                  onClick={() => {
                    setField("cashType", "none");
                    setField("cashAmount", 0);
                  }}
                >
                  <div className="cash-btn-content">
                    <MdBlock className="cash-btn-icon" />
                    <span>Sin efectivo</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`swap-cash-btn ${offer.cashType === "add" ? "active" : ""}`}
                  onClick={() => {
                    setField("cashType", "add");
                    setField("cashAmount", suggestedCash);
                  }}
                >
                  <div className="cash-btn-content">
                    <MdAdd className="cash-btn-icon" />
                    <span>Yo agrego</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`swap-cash-btn ${offer.cashType === "request" ? "active" : ""}`}
                  onClick={() => {
                    setField("cashType", "request");
                    setField("cashAmount", suggestedCash);
                  }}
                >
                  <div className="cash-btn-content">
                    <MdTrendingUp className="cash-btn-icon" />
                    <span>Solicito</span>
                  </div>
                </button>
              </div>

              {offer.cashType !== "none" && (
                <div className="swap-cash-amount">
                  <div className="swap-cash-input-group">
                    <label className="swap-cash-label">
                      Cantidad en efectivo
                    </label>
                    <div className="swap-cash-input-wrapper">
                      <span className="cash-currency">$</span>
                      <input
                        type="number"
                        className="swap-cash-input"
                        value={offer.cashAmount || ""}
                        onChange={(e) =>
                          setField(
                            "cashAmount",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        placeholder="0"
                        min="0"
                        max={Math.max(10000, item.price * 2)}
                        step="1"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(10000, item.price * 2)}
                    step="100"
                    value={offer.cashAmount || 0}
                    onChange={(e) =>
                      setField("cashAmount", Number(e.target.value))
                    }
                    className="swap-cash-slider"
                  />
                  {errors.cashAmount && (
                    <span className="field-error">{errors.cashAmount}</span>
                  )}
                </div>
              )}
            </div>

            <div className="swap-form-group">
              <label htmlFor="swap-message" className="swap-label">
                Mensaje para el vendedor *
              </label>
              <div className="swap-textarea-wrapper">
                <textarea
                  id="swap-message"
                  rows="5"
                  maxLength={400}
                  value={offer.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder="Explica el estado de tu artículo, accesorios incluidos y por qué el intercambio es justo para ambas partes."
                  className={`swap-textarea ${errors.message ? "input-error" : ""}`}
                />
                <span className="swap-char-counter">
                  {offer.message.length}/400
                </span>
              </div>
              {errors.message && (
                <span className="field-error">{errors.message}</span>
              )}
            </div>

            {errors.submit && (
              <div className="swap-error-alert">
                <span>⚠️</span>
                {errors.submit}
              </div>
            )}

            <div className="swap-form-actions">
              <button
                type="button"
                className="swap-btn-secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="swap-btn-primary"
                disabled={isSubmitting || !isVerified}
              >
                <MdSwapHoriz />
                {isSubmitting ? "Enviando..." : "Enviar propuesta"}
              </button>
            </div>
          </form>
        ) : (
          <div className="swap-success">
            <div className="swap-success-icon">
              <MdCheckCircle />
            </div>
            <h2 className="swap-success-title">¡Propuesta enviada!</h2>
            <p className="swap-success-text">
              Tu oferta de intercambio para <strong>{item.name}</strong> ha sido
              enviada exitosamente. El vendedor la revisará y podrán continuar
              la conversación desde la bandeja de entrada.
            </p>
            <div className="swap-success-actions">
              <button
                type="button"
                className="swap-btn-secondary"
                onClick={() => navigate("/")}
              >
                <MdExplore />
                Explorar más
              </button>
              <button
                type="button"
                className="swap-btn-primary"
                onClick={() => navigate("/inbox")}
              >
                <MdInbox />
                Ir a mensajes
              </button>
            </div>
          </div>
        )}
      </section>
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onStartVerification={() => {
          setShowVerificationModal(false);
          navigate("/profile"); // O a la página de verificación
        }}
      />
    </main>
  );
}

export default SwapPage;
