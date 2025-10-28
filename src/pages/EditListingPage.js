import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiPhotograph, HiX } from "react-icons/hi";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import "./EditListingPage.css";

function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useData();

  const [listing, setListing] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos de la publicación
  useEffect(() => {
    const fetchListing = async () => {
      if (!id || !data?.byId) {
        return;
      }
      const result = data.byId(id);
      if (result) {
        setListing(result);
        setTitle(result.name || "");
        setDescription(result.description || "");
        setImages((result.images || []).map((url) => ({ url })));
      } else {
        setFeedback({
          type: "error",
          message: "No se encontró la publicación",
        });
      }
    };
    fetchListing();
  }, [id, data]);

  // Verificar permisos
  useEffect(() => {
    if (listing && user && listing.ownerEmail !== user.email) {
      navigate("/");
    }
  }, [listing, user, navigate]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const objectUrls = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));
    setImages((prev) => [...prev, ...objectUrls]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const auth = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Refrescar sesión antes de actualizar
      if (auth.refresh) {
        await auth.refresh();
      }
      // Aquí iría la lógica para subir imágenes al servidor
      const updatedListing = {
        ...listing,
        name: title,
        description,
        images: images.filter((img) => !img.isNew).map((img) => img.url || img),
        newImages: images.filter((img) => img.isNew).map((img) => img.file),
      };

      if (data?.updateListing) {
        const result = await data.updateListing(id, updatedListing);
        if (result?.success) {
          setFeedback({
            type: "success",
            message: "Publicación actualizada correctamente",
          });
          setTimeout(() => navigate("/profile/listings"), 2000);
        } else {
          throw new Error(result?.error || "Error al actualizar");
        }
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Error al actualizar la publicación",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!listing) {
    return (
      <main className="container page">
        <div className="panel">
          <p className="muted">Cargando publicación...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container page edit-listing-page">
      <div className="panel edit-listing-panel">
        <div className="category-header-bar">
          <button
            className="page-nav-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <h1 className="category-header-title">Editar publicación</h1>
          <span style={{ width: 46 }}></span>
        </div>

        {feedback.message && (
          <div className={`edit-feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-listing-form">
          <div className="edit-listing-section">
            <label className="edit-listing-label">
              Título
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de tu artículo..."
                className="edit-listing-input"
              />
            </label>
          </div>

          <div className="edit-listing-section">
            <label className="edit-listing-label">
              Descripción
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu artículo..."
                rows={6}
                className="edit-listing-textarea"
              />
            </label>
          </div>

          <div className="edit-listing-section">
            <h3 className="edit-section-title">Imágenes</h3>
            <div className="edit-images-grid">
              {images.map((img, index) => (
                <div key={index} className="edit-image-container">
                  <img
                    src={img.preview || img.url || img}
                    alt={`Imagen ${index + 1}`}
                    className="edit-image-preview"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="edit-image-remove"
                  >
                    <HiX size={20} />
                  </button>
                </div>
              ))}
              <label className="edit-image-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="edit-image-input"
                />
                <HiPhotograph size={24} />
                <span>Añadir imagen</span>
              </label>
            </div>
          </div>

          <div className="edit-listing-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="edit-btn outline"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="edit-btn primary"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default EditListingPage;
