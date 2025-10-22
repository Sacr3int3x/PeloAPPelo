import React, { useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import LoadingOverlay from "../components/LoadingOverlay/LoadingOverlay";
import "../styles/CategoryPage.css";
import "./ProfilePage.css";

function BillingDetails() {
  const auth = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const user = auth?.user;
  const loading = data?.loading;
  const allItems = data?.allItems || [];

  useEffect(() => {
    if (!auth?.token) {
      navigate('/login', { state: { from: '/profile/billing-details' } });
    }
  }, [auth?.token, navigate]);
  // Solo mostrar publicaciones vendidas
  const mySoldItems = useMemo(() => {
    if (!user) return [];
    const normalizedEmail = String(user.email).toLowerCase();
    return allItems.filter(
      (item) =>
        (String(item.ownerEmail || "").toLowerCase() === normalizedEmail ||
          String(item.ownerId || "").toLowerCase() ===
            String(user.id).toLowerCase()) &&
        ["sold", "finalizado", "finalized"].includes(
          String(item.status).toLowerCase(),
        ),
    );
  }, [allItems, user]);

  const billingSummary = useMemo(() => {
    const rates = {
      premium: 0.1,
      plus: 0.05,
      gratis: 0,
    };
    const labels = {
      premium: "Premium",
      plus: "Plus",
      gratis: "Gratis",
    };
    const summary = {
      premium: { count: 0, total: 0 },
      plus: { count: 0, total: 0 },
      gratis: { count: 0, total: 0 },
    };
    let grandTotal = 0;
    mySoldItems.forEach((item) => {
      const plan = (item.plan || "gratis").toLowerCase();
      const rate = rates[plan] ?? 0;
      const price = Number(item.price || 0);
      const cost = price * rate;
      if (summary[plan]) {
        summary[plan].count += 1;
        summary[plan].total += cost;
      }
      grandTotal += cost;
    });
    return { summary, total: grandTotal, rates, labels };
  }, [mySoldItems]);

  if (loading) {
    return <LoadingOverlay message="Cargando datos de facturación..." />;
  }

  if (!data?.allItems) {
    return (
      <div className="profile-billing-details category-header-bar">
        <p style={{ textAlign: "center", padding: "20px" }}>
          Error al cargar los datos de facturación. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div
      className="profile-billing-details category-header-bar"
      style={{
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      <div className="category-header-bar" style={{ marginBottom: 24 }}>
        <button
          className="page-nav-btn"
          onClick={() => navigate(-1)}
          title="Volver"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <h2 className="category-header-title" style={{ margin: 0 }}>
          Detalle de Facturación
        </h2>
        <span style={{ width: 46 }}></span>
      </div>
      {mySoldItems.length === 0 ? (
        <p style={{ textAlign: "center" }}>
          No tienes publicaciones vendidas aún.
        </p>
      ) : (
        <>
          <div className="profile-billing-grid">
            {Object.entries(billingSummary.summary).map(([plan, info]) => (
              <article key={plan} className="profile-billing-card">
                <div className="profile-billing-plan">
                  {billingSummary.labels[plan] || plan}
                </div>
                <div className="profile-billing-count">
                  {info.count} publicación{info.count === 1 ? "" : "es"}
                </div>
                <div className="profile-billing-total">
                  REF {info.total.toFixed(2)}
                </div>
                <small className="muted">
                  {billingSummary.rates[plan] * 100}% del precio
                </small>
              </article>
            ))}
          </div>
          <div className="profile-billing-summary">
            <span className="muted">Total estimado</span>
            <strong>REF {billingSummary.total.toFixed(2)}</strong>
          </div>
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Ventas realizadas</h3>
            <ul style={{ fontSize: "1em", padding: 0, listStyle: "none" }}>
              {mySoldItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    marginBottom: 16,
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "1.1em" }}>
                    {item.title}
                  </div>
                  <div style={{ color: "#666", fontSize: "0.97em" }}>
                    Precio: <b>REF {item.price}</b> | Plan:{" "}
                    <b>{item.plan || "gratis"}</b>
                  </div>
                  <div style={{ color: "#888", fontSize: "0.93em" }}>
                    Estado: <b>{item.status}</b>
                  </div>
                  {item.createdAt && (
                    <div style={{ color: "#aaa", fontSize: "0.9em" }}>
                      Publicado: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default BillingDetails;
