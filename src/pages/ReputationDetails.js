import React, { useEffect, useState } from "react";
import Rating from "../components/Rating/Rating";
import { useAuth } from "../context/AuthContext";
import { fetchMyReputations } from "../services/transactions";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay/LoadingOverlay";
import "./ProfilePage.css";

function ReputationDetails() {
  const auth = useAuth();
  const token = auth?.token || null;
  const [reputations, setReputations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/profile/reputation-details' } });
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMyReputations(token)
      .then((response) => {
        if (cancelled) return;
        setReputations(response.reputations || []);
        setError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setError(error?.message || "No se pudieron cargar las reputaciones.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="profile-reputation-details">
      <button
        className="profile-back-btn"
        onClick={() => navigate(-1)}
        style={{ position: "absolute", left: 16, top: 16 }}
      >
        &larr; Volver
      </button>
      <h2 style={{ marginTop: 40 }}>Detalle de Reputaciones</h2>
      {loading ? (
        <LoadingOverlay message="Cargando reputaciones..." />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p className="field-error">{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '10px' }}
          >
            Intentar de nuevo
          </button>
        </div>
      ) : reputations && reputations.length ? (
        reputations.map((rep) => (
          <article key={rep.id} className="profile-reputation-item">
            <div className="profile-reputation-rating">
              <Rating value={rep.rating} votes={1} />
              <span className="profile-reputation-date">
                {new Date(rep.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="profile-reputation-meta">
              <strong>{rep.listingName || "Operación"}</strong>
              <span>
                De {rep.fromUser?.name || rep.fromUser?.email || "Usuario"}
              </span>
            </div>
            {rep.comment && (
              <p className="profile-reputation-comment">{rep.comment}</p>
            )}
          </article>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p className="muted">No tienes reputaciones registradas aún.</p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Las reputaciones aparecerán aquí cuando otros usuarios califiquen tus operaciones.
          </p>
        </div>
      )}
    </div>
  );
}

export default ReputationDetails;
