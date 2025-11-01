import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft, HiSearch, HiPencil } from "react-icons/hi";
import "../styles/CategoryPage.css";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { fmt } from "../utils/format";
import "./ProfilePage.css";
import MarcarComoVendidoModal from "../components/MarcarComoVendidoModal/MarcarComoVendidoModal";

const statusLabel = {
  active: "Activa",
  paused: "Pausada",
  sold: "Vendida",
  finalizado: "Finalizada",
};

const planLabel = {
  premium: "Premium",
  plus: "Plus",
  gratis: "Gratis",
};

function ProfileListingsPage() {
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const updateStatus = data?.updateStatus || (() => {});
  const refreshListings = data?.refresh || (() => {});

  const listings = useMemo(() => {
    if (!user) return [];
    return data?.byOwner ? data.byOwner(user.email) : [];
  }, [data, user]);

  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showSoldModal, setShowSoldModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const filteredListings = useMemo(() => {
    return listings.filter(
      (listing) =>
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [listings, searchTerm]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(""), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Restablecer la posición de desplazamiento al montar el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [confirmAction, setConfirmAction] = useState({
    show: false,
    action: null,
  });

  const handleStatusChange = async (listingId, nextStatus) => {
    if (nextStatus === "sold") {
      const listing = listings.find((l) => l.id === listingId);
      if (listing) {
        setSelectedListing(listing);
        setShowSoldModal(true);
      }
      return;
    }
    const promptMap = {
      active: "¿Deseas reactivar esta publicación?",
      paused: "¿Deseas pausar temporalmente esta publicación?",
    };
    const message = promptMap[nextStatus] || "¿Confirmas esta acción?";
    setConfirmAction({
      show: true,
      action: async () => {
        const result = await updateStatus(listingId, nextStatus);
        if (result?.success) {
          setFeedback("Estado actualizado correctamente.");
        } else if (result?.error) {
          setFeedback(result.error);
        } else {
          setFeedback("No se pudo actualizar el estado.");
        }
        setConfirmAction({ show: false, action: null });
      },
      message,
      listingId,
      nextStatus,
    });
  };

  const handleEdit = (listing) => {
    if (!listing.id) {
      setFeedback("Error: No se puede editar la publicación");
      return;
    }
    navigate(`/publicar/${listing.id}`);
  };

  if (!user) {
    return (
      <main className="container page profile-listings-page">
        <div className="panel">
          <p className="muted">Inicia sesión para ver tus publicaciones.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container page profile-listings-page">
      <section className="panel profile-listings-panel">
        <div className="category-header-bar" style={{ marginBottom: 24 }}>
          <button
            className="page-nav-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <h2 className="category-header-title" style={{ margin: 0 }}>
            Mis publicaciones ({listings.length})
          </h2>
          <span style={{ width: 46 }}></span>
        </div>

        {feedback && <div className="profile-feedback">{feedback}</div>}

        {confirmAction.show && (
          <div className="profile-confirm-overlay">
            <div className="profile-confirm-dialog">
              <p className="profile-confirm-message">{confirmAction.message}</p>
              <div className="profile-confirm-actions">
                <button
                  className="status-btn outline"
                  onClick={() =>
                    setConfirmAction({ show: false, action: null })
                  }
                >
                  Cancelar
                </button>
                <button
                  className="status-btn primary"
                  onClick={confirmAction.action}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="profile-listings-search">
          <HiSearch />
          <input
            type="text"
            placeholder="Buscar en mis publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredListings.length ? (
          <div className="profile-listing-list">
            {filteredListings.map((listing) => (
              <article key={listing.id} className="profile-listing-row">
                <img
                  src={listing.images?.[0] || "/images/placeholder.jpg"}
                  alt={listing.name}
                  className="profile-listing-thumb"
                />
                <div className="profile-listing-detail">
                  <div className="profile-listing-header">
                    <h2 className="profile-listing-title">{listing.name}</h2>
                    <span
                      className={`profile-status-chip status-${listing.status}`}
                    >
                      {statusLabel[listing.status] || listing.status}
                    </span>
                  </div>
                  <div className="profile-listing-meta">
                    <span>REF {fmt(listing.price)}</span>
                    <span>{listing.location}</span>
                    <span
                      className={`profile-plan plan-${listing.plan || "gratis"}`}
                    >
                      {planLabel[listing.plan] || "Publicación"}
                    </span>
                  </div>
                  <p className="profile-listing-description">
                    {(listing.description || "Sin descripción.").slice(0, 160)}
                    {listing.description && listing.description.length > 160
                      ? "…"
                      : ""}
                  </p>
                </div>
                <div className="profile-status-actions">
                  <button
                    type="button"
                    className="status-btn edit"
                    onClick={() => handleEdit(listing)}
                    title="Editar descripción e imágenes"
                  >
                    <HiPencil size={18} style={{ marginRight: 4 }} />
                    Editar
                  </button>
                  {listing.status !== "active" && (
                    <button
                      type="button"
                      className="status-btn outline"
                      onClick={() => handleStatusChange(listing.id, "active")}
                    >
                      Reactivar
                    </button>
                  )}
                  {listing.status === "active" && (
                    <button
                      type="button"
                      className="status-btn outline"
                      onClick={() => handleStatusChange(listing.id, "paused")}
                    >
                      Pausar
                    </button>
                  )}
                  {!["sold", "finalizado", "finalized", "paused"].includes(
                    listing.status,
                  ) && (
                    <button
                      type="button"
                      className="status-btn danger"
                      onClick={() => handleStatusChange(listing.id, "sold")}
                    >
                      Finalizar
                    </button>
                  )}
                  {["sold", "finalizado", "finalized", "paused"].includes(
                    listing.status,
                  ) && (
                    <button
                      type="button"
                      className="status-btn primary"
                      onClick={() => handleStatusChange(listing.id, "active")}
                    >
                      Republicar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Aún no has publicado anuncios.</p>
        )}
      </section>

      <MarcarComoVendidoModal
        listing={selectedListing}
        isOpen={showSoldModal}
        onClose={() => {
          setShowSoldModal(false);
          setSelectedListing(null);
        }}
        onSuccess={() => {
          setFeedback("Publicación marcada como vendida correctamente.");
          setShowSoldModal(false);
          setSelectedListing(null);
          // Refrescar los datos para mostrar el nuevo estado
          refreshListings();
        }}
      />
    </main>
  );
}

export default ProfileListingsPage;
