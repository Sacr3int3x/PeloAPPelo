import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { toast } from "react-toastify";
import "../styles/CategoryPage.css";
import Select from "../components/Select/Select";
import ImageModal from "../components/ImageModal/ImageModal";
import {
  fetchAdminAudit,
  fetchAdminConversations,
  fetchAdminListings,
  fetchAdminOverview,
  fetchAdminRaw,
  fetchAdminUsers,
  updateAdminListing,
  updateAdminUser,
} from "../services/adminApi";
import { fetchAdminReputations } from "../services/transactions";
import "../styles/AdminDashboard.css";

const tabs = [
  { id: "overview", label: "Resumen" },
  { id: "listings", label: "Publicaciones" },
  { id: "users", label: "Usuarios" },
  { id: "conversations", label: "Conversaciones" },
  { id: "verifications", label: "Verificaciones" },
  { id: "reputations", label: "Reputaciones" },
  { id: "audit", label: "Auditoría" },
  { id: "raw", label: "Datos crudos" },
];

const statusOptions = [
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "sold", label: "Vendida" },
  { value: "suspended", label: "Suspendida" },
  { value: "removed", label: "Removida" },
];

const planOptions = [
  { value: "premium", label: "Premium" },
  { value: "plus", label: "Plus" },
  { value: "gratis", label: "Gratis" },
];

const roleOptions = [
  { value: "user", label: "Usuario" },
  { value: "moderator", label: "Moderador" },
  { value: "admin", label: "Administrador" },
];

const pageSizes = [10, 20, 50];

function StatBar({ label, value, max }) {
  const width = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="admin-bar-row">
      <span className="admin-bar-label">{label}</span>
      <div className="admin-bar">
        <div className="admin-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <span className="admin-bar-value">{value}</span>
    </div>
  );
}

function StatBars({ data }) {
  if (!data?.length) return <p className="muted">Sin datos.</p>;
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="admin-bars">
      {data.map((item) => (
        <StatBar
          key={item.label}
          label={item.label}
          value={item.value}
          max={max}
        />
      ))}
    </div>
  );
}

function Sparkline({ data, color = "#4f46e5" }) {
  if (!data?.length)
    return <div className="admin-sparkline muted">Sin datos</div>;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 100 : (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / max) * 100;
      return `${x},${Number.isFinite(y) ? y : 100}`;
    })
    .join(" ");
  return (
    <div className="admin-sparkline">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
      </svg>
      <div className="admin-sparkline-footer">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return (
    <div className="admin-pagination">
      <div className="admin-pagination-buttons">
        <button
          type="button"
          className="btn outline sm"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          Anterior
        </button>
        <span>
          Página {page + 1} de {totalPages}
        </span>
        <button
          type="button"
          className="btn outline sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page + 1 >= totalPages}
        >
          Siguiente
        </button>
      </div>
      <label className="admin-page-size">
        Mostrar
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        registros
      </label>
    </div>
  );
}

function useAsyncState(initialState = null) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exec = useCallback(async (fn) => {
    setLoading(true);
    setError("");
    try {
      const result = await fn();
      setState(result);
      return result;
    } catch (err) {
      const message = err?.message || "Ocurrió un error.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, setState, loading, error, exec };
}

function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const {
    state: overview,
    loading: overviewLoading,
    error: overviewError,
    exec: execOverview,
  } = useAsyncState(null);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  const [userFilters, setUserFilters] = useState({
    q: "",
    role: "",
    location: "",
    page: 0,
    pageSize: 10,
  });
  const [usersData, setUsersData] = useState({ list: [], total: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const [listingFilters, setListingFilters] = useState({
    q: "",
    status: "",
    category: "",
    plan: "",
    location: "",
    owner: "",
    page: 0,
    pageSize: 10,
  });
  const [listingsData, setListingsData] = useState({ list: [], total: 0 });
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState("");
  const [editingListing, setEditingListing] = useState(null);

  const {
    state: conversationsData,
    loading: conversationsLoading,
    error: conversationsError,
    exec: execConversations,
  } = useAsyncState({ conversations: [], total: 0, limit: 10, offset: 0 });
  const [conversationFilters, setConversationFilters] = useState({
    q: "",
    page: 0,
    pageSize: 10,
  });

  const [reputationFilters, setReputationFilters] = useState({
    q: "",
    page: 0,
    pageSize: 10,
  });
  const [reputationData, setReputationData] = useState({ list: [], total: 0 });
  const [reputationLoading, setReputationLoading] = useState(false);
  const [reputationError, setReputationError] = useState("");

  const {
    state: auditData,
    loading: auditLoading,
    error: auditError,
    exec: execAudit,
  } = useAsyncState({ logs: [], total: 0, limit: 10, offset: 0 });
  const [auditFilters, setAuditFilters] = useState({ page: 0, pageSize: 10 });

  const [rawDump, setRawDump] = useState(null);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawError, setRawError] = useState("");

  const [verificationFilters, setVerificationFilters] = useState({
    status: "",
  });
  const [verificationData, setVerificationData] = useState({
    list: [],
    total: 0,
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageSrc: "",
    title: "",
  });

  const isAdmin = Boolean(user?.isAdmin);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    await execOverview(() => fetchAdminOverview(token));
    setOverviewLoaded(true);
  }, [token, execOverview]);

  const {
    q: userQ,
    role: userRole,
    location: userLocation,
    page: userPage,
    pageSize: userPageSize,
  } = userFilters;

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    setUsersError("");
    try {
      const response = await fetchAdminUsers(token, {
        q: userQ,
        role: userRole,
        location: userLocation,
        limit: userPageSize,
        offset: userPage * userPageSize,
      });
      setUsersData({ list: response.users || [], total: response.total || 0 });
    } catch (error) {
      setUsersError(error?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setUsersLoading(false);
    }
  }, [token, userQ, userRole, userLocation, userPage, userPageSize]);

  const {
    q: listingQ,
    status: listingStatus,
    category: listingCategory,
    plan: listingPlan,
    location: listingLocation,
    owner: listingOwner,
    page: listingPage,
    pageSize: listingPageSize,
  } = listingFilters;

  const loadListings = useCallback(async () => {
    if (!token) return;
    setListingsLoading(true);
    setListingsError("");
    try {
      const response = await fetchAdminListings(token, {
        q: listingQ,
        status: listingStatus,
        category: listingCategory,
        plan: listingPlan,
        location: listingLocation,
        owner: listingOwner,
        limit: listingPageSize,
        offset: listingPage * listingPageSize,
      });
      setListingsData({
        list: response.items || [],
        total: response.total || 0,
      });
    } catch (error) {
      setListingsError(
        error?.message || "No se pudieron cargar las publicaciones.",
      );
    } finally {
      setListingsLoading(false);
    }
  }, [
    token,
    listingQ,
    listingStatus,
    listingCategory,
    listingPlan,
    listingLocation,
    listingOwner,
    listingPage,
    listingPageSize,
  ]);

  const {
    q: conversationsQ,
    page: conversationsPage,
    pageSize: conversationsPageSize,
  } = conversationFilters;

  const loadConversations = useCallback(async () => {
    if (!token) return;
    await execConversations(() =>
      fetchAdminConversations(token, {
        q: conversationsQ,
        limit: conversationsPageSize,
        offset: conversationsPage * conversationsPageSize,
      }),
    );
  }, [
    token,
    conversationsQ,
    conversationsPage,
    conversationsPageSize,
    execConversations,
  ]);

  const {
    q: reputationsQ,
    page: reputationsPage,
    pageSize: reputationsPageSize,
  } = reputationFilters;

  const loadReputations = useCallback(async () => {
    if (!token) return;
    setReputationLoading(true);
    setReputationError("");
    try {
      const response = await fetchAdminReputations(
        {
          q: reputationsQ,
          limit: reputationsPageSize,
          offset: reputationsPage * reputationsPageSize,
        },
        token,
      );
      setReputationData({
        list: response.reputations || [],
        total: response.total || 0,
      });
    } catch (error) {
      setReputationError(
        error?.message || "No se pudieron cargar las reputaciones.",
      );
    } finally {
      setReputationLoading(false);
    }
  }, [token, reputationsQ, reputationsPage, reputationsPageSize]);

  const { page: auditPage, pageSize: auditPageSize } = auditFilters;

  const loadAudit = useCallback(async () => {
    if (!token) return;
    await execAudit(() =>
      fetchAdminAudit(token, {
        limit: auditPageSize,
        offset: auditPage * auditPageSize,
      }),
    );
  }, [token, auditPage, auditPageSize, execAudit]);

  const ensureRaw = useCallback(async () => {
    if (!token || rawDump || rawLoading) return;
    setRawLoading(true);
    setRawError("");
    try {
      const response = await fetchAdminRaw(token);
      setRawDump(response);
    } catch (error) {
      setRawError(error?.message || "No se pudieron obtener los datos.");
    } finally {
      setRawLoading(false);
    }
  }, [token, rawDump, rawLoading]);

  const loadVerifications = useCallback(async () => {
    if (!token) return;
    setVerificationLoading(true);
    setVerificationError("");
    try {
      const response = await fetch(`/api/admin/verification/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al cargar verificaciones");
      const data = await response.json();
      // The backend returns { verifications: [...] }, but we need { list: [...], total: number }
      let verifications = data.verifications || [];

      // Apply status filter
      if (verificationFilters.status) {
        verifications = verifications.filter(
          (v) => v.verificationStatus === verificationFilters.status,
        );
      }

      setVerificationData({
        list: verifications,
        total: verifications.length,
      });
    } catch (error) {
      setVerificationError(error.message);
    } finally {
      setVerificationLoading(false);
    }
  }, [token, verificationFilters.status]);

  const handleVerificationAction = async (verificationId, action) => {
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      const response = await fetch(
        `/api/admin/verification/${endpoint}/${verificationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok)
        throw new Error(
          `Error al ${action === "approve" ? "aprobar" : "rechazar"} verificación`,
        );
      toast.success(
        `Verificación ${action === "approve" ? "aprobada" : "rechazada"} exitosamente`,
      );
      loadVerifications(); // Recargar la lista
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openImageModal = (imageSrc, title) => {
    setImageModal({
      isOpen: true,
      imageSrc,
      title,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageSrc: "",
      title: "",
    });
  };

  useEffect(() => {
    if (!isAdmin || !token) return;
    if (!overviewLoaded) {
      loadOverview();
    }
  }, [isAdmin, token, overviewLoaded, loadOverview]);

  useEffect(() => {
    if (isAdmin && token && tab === "users") {
      loadUsers();
    }
  }, [tab, isAdmin, token, loadUsers]);

  useEffect(() => {
    if (isAdmin && token && tab === "listings") {
      loadListings();
    }
  }, [tab, isAdmin, token, loadListings]);

  useEffect(() => {
    if (isAdmin && token && tab === "conversations") {
      loadConversations();
    }
  }, [tab, isAdmin, token, loadConversations]);

  useEffect(() => {
    if (isAdmin && token && tab === "reputations") {
      loadReputations();
    }
  }, [tab, isAdmin, token, loadReputations]);

  useEffect(() => {
    if (isAdmin && token && tab === "audit") {
      loadAudit();
    }
  }, [tab, isAdmin, token, loadAudit]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    if (tab === "raw") {
      ensureRaw();
    }
  }, [tab, isAdmin, token, ensureRaw]);

  useEffect(() => {
    if (isAdmin && token && tab === "verifications") {
      loadVerifications();
    }
  }, [tab, isAdmin, token, loadVerifications]);

  const overviewTotals = overview?.totals || {};

  const categoryStats = overview?.stats?.byCategory || [];
  const statusStats = overview?.stats?.byStatus || [];
  const listingsDaily = overview?.stats?.listingsDaily || [];
  const usersDaily = overview?.stats?.usersDaily || [];
  const conversationsDaily = overview?.stats?.conversationsDaily || [];

  const handleUserEdit = (userRecord) => {
    setEditingUser({
      id: userRecord.id,
      name: userRecord.name || "",
      location: userRecord.location || "",
      phone: userRecord.phone || "",
      role: userRecord.role || "user",
    });
  };

  const cancelUserEdit = () => setEditingUser(null);

  const saveUserEdit = async () => {
    if (!editingUser || !token) return;
    try {
      const payload = {
        name: editingUser.name,
        location: editingUser.location,
        phone: editingUser.phone,
        role: editingUser.role,
      };
      const response = await updateAdminUser(token, editingUser.id, payload);
      setUsersData((prev) => ({
        ...prev,
        list: prev.list.map((item) =>
          item.id === editingUser.id ? { ...item, ...response.user } : item,
        ),
      }));
      cancelUserEdit();
    } catch (error) {
      setUsersError(error?.message || "No se pudo guardar el usuario.");
    }
  };

  const handleListingEdit = (listing) => {
    setEditingListing({
      id: listing.id,
      status: listing.status || "active",
      plan: listing.plan || "gratis",
      moderationNotes: listing.moderationNotes || "",
    });
  };

  const cancelListingEdit = () => setEditingListing(null);

  const saveListingEdit = async () => {
    if (!editingListing || !token) return;
    try {
      const payload = {
        status: editingListing.status,
        plan: editingListing.plan,
        moderationNotes: editingListing.moderationNotes,
      };
      const response = await updateAdminListing(
        token,
        editingListing.id,
        payload,
      );
      setListingsData((prev) => ({
        ...prev,
        list: prev.list.map((item) =>
          item.id === editingListing.id ? { ...item, ...response.item } : item,
        ),
      }));
      cancelListingEdit();
    } catch (error) {
      setListingsError(
        error?.message || "No se pudo actualizar la publicación.",
      );
    }
  };

  if (!user) {
    return (
      <main className="container page admin-page">
        <div className="panel">
          <p>Inicia sesión para acceder al panel administrativo.</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container page admin-page">
        <div className="panel">
          <h1>Acceso restringido</h1>
          <p>No tienes permisos para ver este contenido.</p>
        </div>
      </main>
    );
  }

  const renderOverview = () => (
    <>
      {overviewError && <div className="admin-error">{overviewError}</div>}
      <section className="admin-section">
        <div className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-value">
              {overviewTotals.users ?? "—"}
            </div>
            <div className="admin-card-title">Usuarios</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-value">
              {overviewTotals.listings ?? "—"}
            </div>
            <div className="admin-card-title">Publicaciones</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-value">
              {overviewTotals.conversations ?? "—"}
            </div>
            <div className="admin-card-title">Conversaciones</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-value">
              {overviewTotals.messages ?? "—"}
            </div>
            <div className="admin-card-title">Mensajes</div>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Distribución por categoría</h2>
        <StatBars data={categoryStats} />
      </section>

      <section className="admin-section">
        <h2>Estado de publicaciones</h2>
        <StatBars data={statusStats} />
      </section>

      <section className="admin-section admin-charts-grid">
        <div>
          <h3>Evolución publicaciones</h3>
          <Sparkline data={listingsDaily} />
        </div>
        <div>
          <h3>Nuevos usuarios</h3>
          <Sparkline data={usersDaily} color="#0ea5e9" />
        </div>
        <div>
          <h3>Conversaciones activas</h3>
          <Sparkline data={conversationsDaily} color="#f97316" />
        </div>
      </section>

      <section className="admin-section">
        <h2>Últimas publicaciones</h2>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Owner</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>
              {overview?.latestListings?.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.price?.toLocaleString?.() || item.price}</td>
                  <td>
                    <span className={`admin-chip status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.ownerEmail}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderUsers = () => (
    <section className="admin-section">
      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setUserFilters((prev) => ({ ...prev, page: 0 }));
          loadUsers();
        }}
      >
        <input
          className="input"
          placeholder="Buscar por email, usuario o nombre"
          value={userFilters.q}
          onChange={(event) =>
            setUserFilters((prev) => ({ ...prev, q: event.target.value }))
          }
        />
        <select
          className="input"
          value={userFilters.role}
          onChange={(event) =>
            setUserFilters((prev) => ({ ...prev, role: event.target.value }))
          }
        >
          <option value="">Todos los roles</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Filtrar por ubicación"
          value={userFilters.location}
          onChange={(event) =>
            setUserFilters((prev) => ({
              ...prev,
              location: event.target.value,
            }))
          }
        />
        <button type="submit" className="btn primary">
          Aplicar filtros
        </button>
      </form>

      {usersError && <div className="admin-error">{usersError}</div>}

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Publicaciones</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usersData.list.map((item) => {
              const isEditing = editingUser?.id === item.id;
              return (
                <tr key={item.id}>
                  <td>{item.email}</td>
                  <td>{item.username}</td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        value={editingUser.name}
                        onChange={(event) =>
                          setEditingUser((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      item.name || "—"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        value={editingUser.location}
                        onChange={(event) =>
                          setEditingUser((prev) => ({
                            ...prev,
                            location: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      item.location || "—"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        value={editingUser.phone}
                        onChange={(event) =>
                          setEditingUser((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      item.phone || "—"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="admin-inline-control">
                        <Select
                          name={`user-role-${item.id}`}
                          value={editingUser.role}
                          onChange={(val) =>
                            setEditingUser((prev) => ({ ...prev, role: val }))
                          }
                          options={roleOptions}
                          placeholder="Selecciona rol"
                          className="select-inline"
                        />
                      </div>
                    ) : (
                      <span
                        className={`admin-role admin-role-${item.role || "user"}`}
                      >
                        {item.role || "user"}
                      </span>
                    )}
                  </td>
                  <td>{item.listings}</td>
                  <td className="admin-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={saveUserEdit}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn outline sm"
                          onClick={cancelUserEdit}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn outline sm"
                        onClick={() => handleUserEdit(item)}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={userFilters.page}
        total={usersData.total}
        pageSize={userFilters.pageSize}
        onPageChange={(page) => setUserFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) =>
          setUserFilters((prev) => ({ ...prev, pageSize, page: 0 }))
        }
      />

      {usersLoading && <p className="muted">Cargando usuarios…</p>}
    </section>
  );

  const renderListings = () => (
    <section className="admin-section">
      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setListingFilters((prev) => ({ ...prev, page: 0 }));
          loadListings();
        }}
      >
        <input
          className="input"
          placeholder="Buscar por título, descripción o owner"
          value={listingFilters.q}
          onChange={(event) =>
            setListingFilters((prev) => ({ ...prev, q: event.target.value }))
          }
        />
        <select
          className="input"
          value={listingFilters.status}
          onChange={(event) =>
            setListingFilters((prev) => ({
              ...prev,
              status: event.target.value,
            }))
          }
        >
          <option value="">Todos los estados</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Categoría"
          value={listingFilters.category}
          onChange={(event) =>
            setListingFilters((prev) => ({
              ...prev,
              category: event.target.value,
            }))
          }
        />
        <input
          className="input"
          placeholder="Plan"
          value={listingFilters.plan}
          onChange={(event) =>
            setListingFilters((prev) => ({ ...prev, plan: event.target.value }))
          }
        />
        <input
          className="input"
          placeholder="Ubicación"
          value={listingFilters.location}
          onChange={(event) =>
            setListingFilters((prev) => ({
              ...prev,
              location: event.target.value,
            }))
          }
        />
        <input
          className="input"
          placeholder="Propietario (email)"
          value={listingFilters.owner}
          onChange={(event) =>
            setListingFilters((prev) => ({
              ...prev,
              owner: event.target.value,
            }))
          }
        />
        <button type="submit" className="btn primary">
          Aplicar filtros
        </button>
      </form>

      {listingsError && <div className="admin-error">{listingsError}</div>}

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Plan</th>
              <th>Owner</th>
              <th>Actualización</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {listingsData.list.map((item) => {
              const isEditing = editingListing?.id === item.id;
              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.price?.toLocaleString?.() || item.price}</td>
                  <td>
                    {isEditing ? (
                      <div className="admin-inline-control">
                        <Select
                          name={`listing-status-${item.id}`}
                          value={editingListing.status}
                          onChange={(val) =>
                            setEditingListing((prev) => ({
                              ...prev,
                              status: val,
                            }))
                          }
                          options={statusOptions}
                          className="select-inline"
                        />
                      </div>
                    ) : (
                      <span className={`admin-chip status-${item.status}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="admin-inline-control">
                        <Select
                          name={`listing-plan-${item.id}`}
                          value={editingListing.plan}
                          onChange={(val) =>
                            setEditingListing((prev) => ({
                              ...prev,
                              plan: val,
                            }))
                          }
                          options={planOptions}
                          className="select-inline"
                        />
                      </div>
                    ) : (
                      item.plan || "—"
                    )}
                  </td>
                  <td>{item.ownerEmail}</td>
                  <td>
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="admin-actions">
                    {isEditing ? (
                      <div className="admin-edit-stack">
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Notas internas"
                          value={editingListing.moderationNotes}
                          onChange={(event) =>
                            setEditingListing((prev) => ({
                              ...prev,
                              moderationNotes: event.target.value,
                            }))
                          }
                        />
                        <div className="admin-edit-actions">
                          <button
                            type="button"
                            className="btn primary sm"
                            onClick={saveListingEdit}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="btn outline sm"
                            onClick={cancelListingEdit}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn outline sm"
                        onClick={() => handleListingEdit(item)}
                      >
                        Moderar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={listingFilters.page}
        total={listingsData.total}
        pageSize={listingFilters.pageSize}
        onPageChange={(page) =>
          setListingFilters((prev) => ({ ...prev, page }))
        }
        onPageSizeChange={(pageSize) =>
          setListingFilters((prev) => ({ ...prev, pageSize, page: 0 }))
        }
      />

      {listingsLoading && <p className="muted">Cargando publicaciones…</p>}
    </section>
  );

  const renderConversations = () => {
    const data = conversationsData || {
      conversations: [],
      total: 0,
      limit: 10,
      offset: 0,
    };
    const page = conversationFilters.page;
    const pageSize = conversationFilters.pageSize;
    return (
      <section className="admin-section">
        <form
          className="admin-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setConversationFilters((prev) => ({ ...prev, page: 0 }));
            loadConversations();
          }}
        >
          <input
            className="input"
            placeholder="Buscar por participante o publicación"
            value={conversationFilters.q}
            onChange={(event) =>
              setConversationFilters((prev) => ({
                ...prev,
                q: event.target.value,
              }))
            }
          />
          <button type="submit" className="btn primary">
            Buscar
          </button>
        </form>

        {conversationsError && (
          <div className="admin-error">{conversationsError}</div>
        )}

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Publicación</th>
                <th>Participantes</th>
                <th>Mensajes</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {data.conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{conversation.id}</td>
                  <td>{conversation.listing?.name || "—"}</td>
                  <td>
                    {conversation.participants
                      .map(
                        (participant) => participant.email || participant.name,
                      )
                      .join(", ")}
                  </td>
                  <td>{conversation.messages?.length || 0}</td>
                  <td>
                    {conversation.updatedAt
                      ? new Date(conversation.updatedAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={data.total || 0}
          pageSize={pageSize}
          onPageChange={(nextPage) =>
            setConversationFilters((prev) => ({ ...prev, page: nextPage }))
          }
          onPageSizeChange={(size) =>
            setConversationFilters((prev) => ({
              ...prev,
              pageSize: size,
              page: 0,
            }))
          }
        />

        {conversationsLoading && (
          <p className="muted">Cargando conversaciones…</p>
        )}
      </section>
    );
  };

  const renderReputations = () => {
    const page = reputationFilters.page;
    const pageSize = reputationFilters.pageSize;
    return (
      <section className="admin-section">
        <form
          className="admin-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setReputationFilters((prev) => ({ ...prev, page: 0 }));
            loadReputations();
          }}
        >
          <input
            className="input"
            placeholder="Buscar por usuario, comentario o publicación"
            value={reputationFilters.q}
            onChange={(event) =>
              setReputationFilters((prev) => ({
                ...prev,
                q: event.target.value,
              }))
            }
          />
          <button type="submit" className="btn outline">
            Filtrar
          </button>
        </form>

        {reputationError && (
          <div className="admin-error">{reputationError}</div>
        )}

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>De</th>
                <th>Para</th>
                <th>Publicación</th>
              </tr>
            </thead>
            <tbody>
              {reputationData.list.map((rep) => (
                <tr key={rep.id}>
                  <td>{new Date(rep.createdAt).toLocaleString()}</td>
                  <td>{rep.rating}</td>
                  <td>{rep.comment || "—"}</td>
                  <td>
                    {rep.fromUser?.email ||
                      rep.fromUser?.name ||
                      rep.fromUser?.id}
                  </td>
                  <td>
                    {rep.toUser?.email || rep.toUser?.name || rep.toUser?.id}
                  </td>
                  <td>{rep.listingName || rep.listingId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={reputationData.total || 0}
          pageSize={pageSize}
          onPageChange={(nextPage) =>
            setReputationFilters((prev) => ({ ...prev, page: nextPage }))
          }
          onPageSizeChange={(size) =>
            setReputationFilters((prev) => ({
              ...prev,
              pageSize: size,
              page: 0,
            }))
          }
        />

        {reputationLoading && <p className="muted">Cargando reputaciones…</p>}
      </section>
    );
  };

  const renderAudit = () => {
    const data = auditData || { logs: [], total: 0, limit: 10, offset: 0 };
    const page = auditFilters.page;
    const pageSize = auditFilters.pageSize;
    return (
      <section className="admin-section">
        {auditError && <div className="admin-error">{auditError}</div>}

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Actor</th>
                <th>Objetivo</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.actor || log.userId}</td>
                  <td>
                    {log.targetType}:{log.targetId}
                  </td>
                  <td>
                    <code className="admin-code">
                      {JSON.stringify(log.details)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={data.total || 0}
          pageSize={pageSize}
          onPageChange={(nextPage) =>
            setAuditFilters((prev) => ({ ...prev, page: nextPage }))
          }
          onPageSizeChange={(size) =>
            setAuditFilters((prev) => ({ ...prev, pageSize: size, page: 0 }))
          }
        />

        {auditLoading && <p className="muted">Cargando auditoría…</p>}
      </section>
    );
  };

  const renderRaw = () => (
    <section className="admin-section">
      {rawError && <div className="admin-error">{rawError}</div>}
      {rawDump ? (
        <pre className="admin-raw">{JSON.stringify(rawDump, null, 2)}</pre>
      ) : rawLoading ? (
        <p className="muted">Cargando datos…</p>
      ) : (
        <p className="muted">No hay datos disponibles.</p>
      )}
    </section>
  );

  const renderVerifications = () => (
    <section className="admin-section">
      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          loadVerifications();
        }}
      >
        <select
          className="input"
          value={verificationFilters.status}
          onChange={(event) =>
            setVerificationFilters((prev) => ({
              ...prev,
              status: event.target.value,
            }))
          }
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
        <button type="submit" className="btn primary">
          Aplicar filtros
        </button>
      </form>

      {verificationError && (
        <div className="admin-error">{verificationError}</div>
      )}

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Documentos</th>
              <th>Estado</th>
              <th>Fecha de solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {verificationData.list.map((verification) => (
              <tr key={verification.id}>
                <td>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => navigate(`/admin/user/${verification.id}`)}
                  >
                    {verification.name || "—"}
                  </button>
                </td>
                <td>{verification.email || "—"}</td>
                <td>
                  {verification.identityDocuments ? (
                    <div className="verification-documents">
                      <div className="document-thumbnails">
                        {verification.identityDocuments.id_front && (
                          <img
                            src={verification.identityDocuments.id_front}
                            alt="Frente del documento"
                            className="document-thumb"
                            onClick={() =>
                              openImageModal(
                                verification.identityDocuments.id_front,
                                "Frente del documento",
                              )
                            }
                          />
                        )}
                        {verification.identityDocuments.id_back && (
                          <img
                            src={verification.identityDocuments.id_back}
                            alt="Reverso del documento"
                            className="document-thumb"
                            onClick={() =>
                              openImageModal(
                                verification.identityDocuments.id_back,
                                "Reverso del documento",
                              )
                            }
                          />
                        )}
                        {verification.identityDocuments.selfie && (
                          <img
                            src={verification.identityDocuments.selfie}
                            alt="Selfie"
                            className="document-thumb"
                            onClick={() =>
                              openImageModal(
                                verification.identityDocuments.selfie,
                                "Selfie",
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    "Sin documentos"
                  )}
                </td>
                <td>
                  <span
                    className={`admin-chip status-${verification.verificationStatus || "pending"}`}
                  >
                    {verification.verificationStatus === "approved"
                      ? "Aprobada"
                      : verification.verificationStatus === "rejected"
                        ? "Rechazada"
                        : "Pendiente"}
                  </span>
                </td>
                <td>
                  {verification.verificationRequestedAt
                    ? new Date(
                        verification.verificationRequestedAt,
                      ).toLocaleString()
                    : "—"}
                </td>
                <td className="admin-actions">
                  <button
                    type="button"
                    className="btn success sm"
                    onClick={() =>
                      handleVerificationAction(verification.id, "approve")
                    }
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="btn danger sm"
                    onClick={() =>
                      handleVerificationAction(verification.id, "reject")
                    }
                  >
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {verificationLoading && <p className="muted">Cargando verificaciones…</p>}
    </section>
  );

  return (
    <main className="container page admin-page">
      <div className="category-header-bar" style={{ marginBottom: 24 }}>
        <button
          className="page-nav-btn"
          onClick={() => navigate(-1)}
          title="Volver"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <h2 className="category-header-title" style={{ margin: 0 }}>
          Panel administrativo
        </h2>
        <span style={{ width: 46 }}></span>
      </div>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Panel administrativo</h1>
          <p className="muted">
            Gestiona usuarios, publicaciones y actividad en tiempo real.
          </p>
        </div>
        <button
          type="button"
          className="btn outline"
          onClick={loadOverview}
          disabled={overviewLoading}
        >
          {overviewLoading ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      <nav className="admin-tabs">
        {tabs.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`admin-tab${tab === option.id ? " active" : ""}`}
            onClick={() => setTab(option.id)}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && renderOverview()}
      {tab === "users" && renderUsers()}
      {tab === "listings" && renderListings()}
      {tab === "conversations" && renderConversations()}
      {tab === "reputations" && renderReputations()}
      {tab === "audit" && renderAudit()}
      {tab === "raw" && renderRaw()}
      {tab === "verifications" && renderVerifications()}

      <ImageModal
        isOpen={imageModal.isOpen}
        imageSrc={imageModal.imageSrc}
        title={imageModal.title}
        onClose={closeImageModal}
      />
    </main>
  );
}

export default AdminDashboard;
