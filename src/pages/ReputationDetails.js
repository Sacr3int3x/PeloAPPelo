import React, { useEffect, useState, useMemo } from "react";
import Rating from "../components/Rating/Rating";
import { useAuth } from "../context/AuthContext";
import { fetchMyReputations } from "../services/transactions";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import {
  FiStar,
  FiTrendingUp,
  FiThumbsUp,
  FiThumbsDown,
  FiMeh,
} from "react-icons/fi";
import "./ReputationDetails.css";

function ReputationDetails() {
  const auth = useAuth();
  const token = auth?.token || null;
  const [reputations, setReputations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
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
  }, [token]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!reputations.length) {
      return {
        total: 0,
        average: 0,
        excellent: 0,
        good: 0,
        regular: 0,
        bad: 0,
        percentages: { excellent: 0, good: 0, regular: 0, bad: 0 },
      };
    }

    const total = reputations.length;
    const sum = reputations.reduce(
      (acc, rep) => acc + Number(rep.rating || 0),
      0,
    );
    const average = (sum / total).toFixed(2);

    // Clasificar calificaciones
    const excellent = reputations.filter((r) => r.rating >= 4.5).length;
    const good = reputations.filter(
      (r) => r.rating >= 3.5 && r.rating < 4.5,
    ).length;
    const regular = reputations.filter(
      (r) => r.rating >= 2.5 && r.rating < 3.5,
    ).length;
    const bad = reputations.filter((r) => r.rating < 2.5).length;

    return {
      total,
      average: parseFloat(average),
      excellent,
      good,
      regular,
      bad,
      percentages: {
        excellent: ((excellent / total) * 100).toFixed(1),
        good: ((good / total) * 100).toFixed(1),
        regular: ((regular / total) * 100).toFixed(1),
        bad: ((bad / total) * 100).toFixed(1),
      },
    };
  }, [reputations]);

  return (
    <main className="container page reputation-details-page">
      {/* Header */}
      <section className="reputation-header">
        <button
          className="page-nav-btn"
          onClick={() => navigate(-1)}
          title="Volver"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <div className="reputation-header-content">
          <h1>Reputaciones Detalladas</h1>
          <p className="reputation-subtitle">
            Historial completo de calificaciones recibidas
          </p>
        </div>
      </section>

      {loading ? (
        <div className="reputation-loading">
          <div className="loading-spinner"></div>
          <p>Cargando reputaciones...</p>
        </div>
      ) : error ? (
        <div className="reputation-error">
          <p className="field-error">{error}</p>
        </div>
      ) : (
        <>
          {/* Estadísticas Generales */}
          <section className="reputation-stats-panel">
            <div className="stats-grid">
              {/* Promedio General */}
              <div className="stat-card stat-primary">
                <div className="stat-icon">
                  <FiStar />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.average}</div>
                  <div className="stat-label">Promedio General</div>
                  <div className="stat-rating">
                    <Rating value={stats.average} votes={stats.total} />
                  </div>
                </div>
              </div>

              {/* Total de Calificaciones */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple">
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total de Calificaciones</div>
                </div>
              </div>

              {/* Excelentes */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-green">
                  <FiThumbsUp />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.excellent}</div>
                  <div className="stat-label">Excelentes (4.5-5)</div>
                  <div className="stat-percentage">
                    {stats.percentages.excellent}%
                  </div>
                </div>
              </div>

              {/* Buenas */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue">
                  <FiThumbsUp />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.good}</div>
                  <div className="stat-label">Buenas (3.5-4.4)</div>
                  <div className="stat-percentage">
                    {stats.percentages.good}%
                  </div>
                </div>
              </div>

              {/* Regulares */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-yellow">
                  <FiMeh />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.regular}</div>
                  <div className="stat-label">Regulares (2.5-3.4)</div>
                  <div className="stat-percentage">
                    {stats.percentages.regular}%
                  </div>
                </div>
              </div>

              {/* Malas */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-red">
                  <FiThumbsDown />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.bad}</div>
                  <div className="stat-label">Malas (&lt;2.5)</div>
                  <div className="stat-percentage">
                    {stats.percentages.bad}%
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de distribución visual */}
            {stats.total > 0 && (
              <div className="distribution-bar-container">
                <h3>Distribución de Calificaciones</h3>
                <div className="distribution-bar">
                  {stats.excellent > 0 && (
                    <div
                      className="bar-segment bar-excellent"
                      style={{ width: `${stats.percentages.excellent}%` }}
                      title={`Excelentes: ${stats.percentages.excellent}%`}
                    >
                      {stats.percentages.excellent}%
                    </div>
                  )}
                  {stats.good > 0 && (
                    <div
                      className="bar-segment bar-good"
                      style={{ width: `${stats.percentages.good}%` }}
                      title={`Buenas: ${stats.percentages.good}%`}
                    >
                      {stats.percentages.good}%
                    </div>
                  )}
                  {stats.regular > 0 && (
                    <div
                      className="bar-segment bar-regular"
                      style={{ width: `${stats.percentages.regular}%` }}
                      title={`Regulares: ${stats.percentages.regular}%`}
                    >
                      {stats.percentages.regular}%
                    </div>
                  )}
                  {stats.bad > 0 && (
                    <div
                      className="bar-segment bar-bad"
                      style={{ width: `${stats.percentages.bad}%` }}
                      title={`Malas: ${stats.percentages.bad}%`}
                    >
                      {stats.percentages.bad}%
                    </div>
                  )}
                </div>
                <div className="distribution-legend">
                  <div className="legend-item">
                    <span className="legend-color legend-excellent"></span>
                    <span>Excelentes</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color legend-good"></span>
                    <span>Buenas</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color legend-regular"></span>
                    <span>Regulares</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color legend-bad"></span>
                    <span>Malas</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Lista de Reputaciones */}
          <section className="reputation-list-section">
            <h2>Todas las Calificaciones ({stats.total})</h2>
            {reputations && reputations.length > 0 ? (
              <div className="reputation-list">
                {reputations.map((rep) => (
                  <article key={rep.id} className="reputation-item">
                    <div className="reputation-item-header">
                      <div className="reputation-rating-display">
                        <Rating value={rep.rating} votes={1} />
                        <span className="reputation-rating-value">
                          {rep.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="reputation-date">
                        {new Date(rep.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="reputation-item-content">
                      <div className="reputation-listing-info">
                        <strong className="reputation-listing-name">
                          {rep.listingName || "Operación"}
                        </strong>
                        <span className="reputation-user-info">
                          De:{" "}
                          {rep.fromUser?.name ||
                            rep.fromUser?.email ||
                            "Usuario"}
                        </span>
                      </div>

                      {rep.comment && (
                        <div className="reputation-comment">
                          <p>"{rep.comment}"</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="reputation-empty">
                <FiStar size={48} />
                <p>No hay reputaciones para mostrar</p>
                <small>
                  Las calificaciones de tus intercambios aparecerán aquí
                </small>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default ReputationDetails;
