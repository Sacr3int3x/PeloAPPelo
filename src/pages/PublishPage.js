import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CATALOG } from "../utils/constants";
import { fmt } from "../utils/format";
import Select from "../components/Select/Select";
import LoadingOverlay from "../components/LoadingOverlay/LoadingOverlay";
import "./PublishPage.css";

function PublishPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { create } = useData();

  const [formData, setFormData] = useState({
    category: "Vehículo",
    name: "",
    brand: "",
    model: "",
    location: user?.location || "",
    price: "",
    description: "",
  });

  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});
  const [showLoader, setShowLoader] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (user?.location) {
      setFormData((prev) => ({ ...prev, location: user.location }));
      clearError("location");
    }
  }, [user?.location]);

  // Map de categorías visibles a keys del catálogo
  const catKey = useMemo(() => {
    const map = {
      Vehículo: "vehiculos",
      Celular: "celulares",
      Electrónica: "electronica",
      Muebles: "muebles",
      Otros: "otros",
    };
    return map[formData.category] || "otros";
  }, [formData.category]);

  // Marcas según categoría (con "Otros")
  const brands = useMemo(() => {
    const b = CATALOG[catKey]?.brands || {};
    const arr = Object.keys(b);
    // Asegurar "Otros"
    if (!arr.includes("Otros")) arr.push("Otros");
    return arr;
  }, [catKey]);

  // Modelos según marca (con "otros")
  const models = useMemo(() => {
    const b = CATALOG[catKey]?.brands || {};
    const list = b[formData.brand] || [];
    const set = new Set(list);
    set.add("otros");
    return Array.from(set);
  }, [catKey, formData.brand]);

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const maxPhotos = 5;

  const addPhotos = async (fileList) => {
    if (!fileList || !fileList.length) return;
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setPhotoError("Máximo 5 fotos por publicación.");
      return;
    }
    const selected = Array.from(fileList).slice(0, remainingSlots);
    try {
      const dataUrls = await Promise.all(selected.map(toDataUrl));
      setPhotos((prev) => [
        ...prev,
        ...dataUrls.map((src) => ({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          src,
        })),
      ]);
      setPhotoError("");
      setFeedback("");
      clearError("photos");
    } catch (err) {
      setPhotoError("No se pudieron procesar algunas imágenes.");
    }
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const next = prev.filter((photo) => photo.id !== id);
      if (next.length) {
        clearError("photos");
      }
      return next;
    });
    setPhotoError("");
  };

  const movePhoto = (id, direction) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((photo) => photo.id === id);
      if (idx === -1) return prev;
      const targetIndex = direction === "left" ? idx - 1 : idx + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const setField = (k, v) => {
    setFormData((prev) => ({ ...prev, [k]: v }));
    clearError(k);
    setFeedback("");
  };

  const validateStepOne = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Agrega un título descriptivo.";
    if (!formData.price || Number(formData.price) <= 0)
      nextErrors.price = "Indica el precio de referencia.";
    if (!formData.description.trim())
      nextErrors.description = "Describe tu producto.";
    if (formData.description.length > 400)
      nextErrors.description = "Máximo 400 caracteres.";
    if (!formData.location)
      nextErrors.location = "Actualiza tu ubicación desde tu perfil.";
    if (!photos.length) nextErrors.photos = "Sube al menos una foto.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validateStepOne()) {
      setFeedback("Revisa los campos marcados antes de publicar.");
      setStep(1);
      return;
    }
    const payload = {
      ...formData,
      price: Number(formData.price || 0),
      images: photos.map((photo) => photo.src),
      ownerEmail: user?.email || "anon@demo.com",
      plan: selectedPlan,
      status: "active",
    };
    setPendingPayload(payload);
    setShowLoader(true);
  };

  const numericPrice = Number(formData.price || 0);

  const plans = useMemo(() => {
    const premiumCost = numericPrice > 0 ? numericPrice * 0.1 : 0;
    const plusCost = numericPrice > 0 ? numericPrice * 0.05 : 0;
    return [
      {
        id: "premium",
        title: "Premium",
        badge: "Mayor visibilidad",
        price: `REF ${fmt(premiumCost)}`,
        description:
          "Aparece en la sección de recientes, búsquedas y destaca sobre todas.",
        features: [
          "Primer lugar en Home",
          "Prioridad en búsquedas",
          "Etiqueta destacada",
        ],
      },
      {
        id: "plus",
        title: "Plus",
        badge: "Recomendado",
        price: `REF ${fmt(plusCost)}`,
        description:
          "Posición preferente en resultados, ideal para captar más visitas.",
        features: ["Prioridad media en búsquedas", "Hasta 3 fotos extra"],
      },
      {
        id: "gratis",
        title: "Gratis",
        badge: "Sin costo",
        price: "REF 0",
        description:
          "Publicación estándar. Aparece luego de las Premium y Plus.",
        features: ["Publicación básica", "Sin prioridad en búsquedas"],
      },
    ];
  }, [numericPrice]);

  const loaderSteps = useMemo(
    () => [
      { label: "Preparando tu publicación…", duration: 1100 },
      { label: "Subiendo tus imágenes…", duration: 1600 },
      { label: "Aplicando plan seleccionado…", duration: 1200 },
      { label: "Publicando en peloAPPelo…", duration: 1300 },
      { label: "Compartiendo tu anuncio…", duration: 1000 },
    ],
    [],
  );

  const finishLoading = useCallback(() => {
    if (pendingPayload) {
      create(pendingPayload);
      setPendingPayload(null);
    }
    setShowLoader(false);
    setTimeout(() => {
      nav("/");
    }, 500);
  }, [create, nav, pendingPayload]);

  const goNext = () => {
    if (step === 1) {
      if (!validateStepOne()) {
        setFeedback("Completa los campos requeridos para continuar.");
        return;
      }
    }
    setFeedback("");
    setStep((s) => Math.min(3, s + 1));
  };

  const goPrev = () => {
    setFeedback("");
    setStep((s) => Math.max(1, s - 1));
  };

  const previewImages = photos.length > 0 ? photos.map((p) => p.src) : ["/images/placeholder.jpg"];

  return (
    <main className="container page publish-page">
      <LoadingOverlay
        active={showLoader}
        steps={loaderSteps}
        onComplete={finishLoading}
      />
      <section className="panel publish-intro">
        <div className="publish-stepper">
          <span>
            Paso {step} de 3 ·{" "}
            {step === 1
              ? "Datos del producto"
              : step === 2
                ? "Plan de publicación"
                : "Vista previa"}
          </span>
          <div className="publish-progress">
            <div
              className="publish-progress-bar"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
        <h1 className="publish-title">Crear nuevo anuncio</h1>
        <p className="publish-subtitle">
          Completa la información del producto y agrega fotos atractivas para destacar tu publicación.
        </p>
      </section>

      <form onSubmit={onSubmit} className="panel publish-form">
        {step === 1 && (
          <>
            <div className="publish-section">
              <h2 className="publish-section-title">¿Qué estás ofreciendo?</h2>
              <div className="publish-category-group">
                {["Vehículo", "Celular", "Electrónica", "Muebles", "Otros"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`publish-category ${formData.category === option ? "active" : ""}`}
                    onClick={() => setField("category", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="publish-grid">
                <div className={`publish-location ${errors.location ? "has-error" : ""}`}>
                  <span className="label">Ubicación</span>
                  <div className="publish-location-value">
                    {formData.location || "Agrega tu ubicación desde tu perfil"}
                  </div>
                  {!formData.location && (
                    <Link to="/profile" className="publish-location-link">
                      Actualizar ubicación
                    </Link>
                  )}
                  {errors.location && <span className="field-error">{errors.location}</span>}
                </div>
                <label className="publish-field">
                  <span className="label">Título</span>
                  <input
                    className={`input ${errors.name ? "input-error" : ""}`}
                    value={formData.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Ej: Toyota Corolla 2020 impecable"
                    required
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>
              </div>
            </div>

            <div className="publish-section">
              <h2 className="publish-section-title">Detalles principales</h2>
              <div className="publish-grid">
                <Select
                  label="Marca"
                  name="brand"
                  value={formData.brand}
                  onChange={(val) =>
                    setFormData((p) => ({
                      ...p,
                      brand: val,
                      model: "",
                    }))
                  }
                  options={brands.map((b) => ({ value: b, label: b }))}
                  placeholder="Selecciona una marca"
                />
                <Select
                  label="Modelo"
                  name="model"
                  value={formData.model}
                  onChange={(val) => setField("model", val)}
                  options={models.map((m) => ({ value: m, label: m }))}
                  placeholder="Selecciona un modelo"
                />
                <label className="publish-field">
                  <span className="label">Precio (REF)</span>
                  <input
                    className={`input ${errors.price ? "input-error" : ""}`}
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="Ej: 9500"
                    required
                  />
                  {errors.price && <span className="field-error">{errors.price}</span>}
                </label>
              </div>
              <label className="publish-field">
                <span className="label">Descripción</span>
                <textarea
                  className={`input ${errors.description ? "input-error" : ""}`}
                  rows="5"
                  value={formData.description}
                  onChange={(e) => setField("description", e.target.value.slice(0, 400))}
                  placeholder="Describe el estado, accesorios incluidos y cualquier detalle relevante..."
                  maxLength={400}
                  required
                />
                <span className="field-hint">
                  {400 - formData.description.length} caracteres disponibles
                </span>
                {errors.description && <span className="field-error">{errors.description}</span>}
              </label>
            </div>

            <div className="publish-section">
              <h2 className="publish-section-title">Fotos del producto</h2>
              <label className="publish-dropzone">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="publish-dropzone-content">
                  <span className="publish-dropzone-icon" aria-hidden>
                    📷
                  </span>
                  <div>
                    <strong>Sube hasta 5 fotos</strong>
                    <p>Arrastra tus imágenes o toca para seleccionar.</p>
                  </div>
                </div>
              </label>
              <span className="field-hint">
                {photos.length} de 5 fotos usadas
              </span>
              {(photoError || errors.photos) && (
                <span className="field-error">{photoError || errors.photos}</span>
              )}
              {!!photos.length && (
                <div className="publish-photo-grid">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="publish-photo-item">
                      <img src={photo.src} alt={`Foto ${index + 1}`} />
                      <div className="publish-photo-actions">
                        <button
                          type="button"
                          className="photo-action"
                          onClick={() => movePhoto(photo.id, "left")}
                          disabled={index === 0}
                          aria-label="Mover a la izquierda"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className="photo-action"
                          onClick={() => movePhoto(photo.id, "right")}
                          disabled={index === photos.length - 1}
                          aria-label="Mover a la derecha"
                        >
                          ▶
                        </button>
                        <button
                          type="button"
                          className="photo-action delete"
                          onClick={() => removePhoto(photo.id)}
                          aria-label="Eliminar foto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="publish-section">
            <h2 className="publish-section-title">Elige el nivel de publicación</h2>
            <div className="publish-plan-grid">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={`publish-plan-card plan-${plan.id} ${selectedPlan === plan.id ? "active" : ""}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="publish-plan-header">
                    <h3 className="publish-plan-title">{plan.title}</h3>
                    <span className="publish-plan-price">{plan.price}</span>
                  </div>
                  <span className="publish-plan-badge">{plan.badge}</span>
                  <p className="muted">{plan.description}</p>
                  <ul className="publish-plan-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="publish-section">
            <h2 className="publish-section-title">Vista previa</h2>
            <div className="publish-preview-panel">
              <div className="publish-preview-hero">
                <img src={previewImages[0]} alt="Vista previa principal" />
              </div>
              {previewImages.length > 1 && (
                <div className="publish-preview-grid">
                  {previewImages.slice(1).map((src, idx) => (
                    <div key={idx} className="publish-preview">
                      <img src={src} alt={`Miniatura ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
              <div className="publish-preview-meta">
                <div className="publish-preview-card">
                  <strong>Título</strong>
                  <span>{formData.name || "Sin título"}</span>
                </div>
                <div className="publish-preview-card">
                  <strong>Ubicación</strong>
                  <span>{formData.location || "No especificada"}</span>
                </div>
                <div className="publish-preview-card">
                  <strong>Precio</strong>
                  <span>
                    {formData.price
                      ? `REF ${fmt(formData.price)}`
                      : "Precio sin definir"}
                  </span>
                </div>
                <div className="publish-preview-card">
                  <strong>Plan</strong>
                  <span>{plans.find((p) => p.id === selectedPlan)?.title || "Gratis"}</span>
                </div>
              </div>
              <div className="publish-preview-card">
                <strong>Descripción</strong>
                <span>{formData.description || "Añade una descripción"}</span>
              </div>
            </div>
          </div>
        )}

        {feedback && <div className="publish-feedback">{feedback}</div>}

        <div className="publish-actions">
          {step > 1 && (
            <button className="btn outline" type="button" onClick={goPrev}>
              Volver
            </button>
          )}
          {step < 3 ? (
            <button className="btn primary" type="button" onClick={goNext}>
              Continuar
            </button>
          ) : (
            <button className="btn primary" type="submit">
              Confirmar publicación
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

export default PublishPage;
