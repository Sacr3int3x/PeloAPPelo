// React y hooks
import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Iconos
import {
  MdBlock,
  MdFlag,
  MdCheckCircle,
  MdDelete,
  MdAttachFile,
  MdSend,
  MdClose,
  MdInventory2,
  MdOpenInNew,
} from "react-icons/md";

// Contextos
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { useData } from "../context/DataContext";
import { useNotifications } from "../context/NotificationContext";

// Servicios
import {
  fetchSwapProposals,
  deleteSwapProposal,
} from "../services/transactions";

// Componentes
import InboxNav from "../components/InboxNav/InboxNav";
import SwapProposals from "../components/SwapProposals/SwapProposals";
import ErrorModal from "../components/ErrorModal/ErrorModal";
import VerificationRequiredModal from "../components/VerificationRequiredModal/VerificationRequiredModal";
import MarcarComoVendidoModal from "../components/MarcarComoVendidoModal/MarcarComoVendidoModal";

// Estilos
import "../styles/InboxPage.css";
import "../styles/seller.css";
// Modal de confirmación reutilizable
const ConfirmModal = ({ open, onClose, onConfirm, text }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-text">{text}</div>
        <div className="modal-actions">
          <button className="btn primary" onClick={onConfirm}>
            Confirmar
          </button>
          <button className="btn outline" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

function InboxPage() {
  // HOOKS Y ESTADOS PRINCIPALES
  const { user, token } = useAuth();
  const {
    conversations,
    sendMessage: sendMessageAction,
    markConversationAsRead,
    blockParticipant,
    deleteConversation,
  } = useMessages();

  const { refreshCounts } = useNotifications();
  const { byId } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados locales
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState("messages");
  const [swapProposals, setSwapProposals] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    action: null,
    text: "",
    onConfirm: null,
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [markSoldModal, setMarkSoldModal] = useState({
    open: false,
    listing: null,
  });

  // Variables derivadas
  const isMobile = window.innerWidth <= 900;
  const myEmail = user?.email || user?.id;
  const isVerified = user?.verificationStatus === "approved";

  // Efectos
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get("conversation");
    const tab = params.get("tab");

    // Cambiar a la pestaña especificada en la URL
    if (tab === "swaps") {
      setActiveTab("swaps");
    } else if (tab === "messages") {
      setActiveTab("messages");
    }

    if (conversationId) {
      setActiveId(conversationId);
      setTimeout(() => {
        markConversationAsRead(conversationId).then(() => {
          refreshCounts();
        });
      }, 100);
    }
  }, [location.search, markConversationAsRead, refreshCounts]);

  useEffect(() => {
    if (activeId) {
      markConversationAsRead(activeId);
    }
  }, [activeId, markConversationAsRead]);

  // Cargar propuestas de intercambio
  useEffect(() => {
    const loadProposals = async () => {
      try {
        if (!token) {
          return;
        }
        const response = await fetchSwapProposals(token);
        setSwapProposals(response.proposals || []);
      } catch (error) {
        console.error("Error al cargar las propuestas:", error);
        setSwapProposals([]);
        // Mostrar modal si la sesión está expirada o inválida
        if (
          error?.message?.toLowerCase().includes("sesión") ||
          error?.message?.toLowerCase().includes("expirada") ||
          error?.message?.toLowerCase().includes("token")
        ) {
          setErrorModal({
            open: true,
            message:
              "Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.",
          });
        }
      }
    };

    if (activeTab === "swaps" && token) {
      loadProposals();
    }
  }, [activeTab, token]);

  // Handler de intercambio (solo eliminar)
  const handleDeleteSwap = async (proposalId) => {
    try {
      await deleteSwapProposal(proposalId, token);
      setSwapProposals((prev) => prev.filter((p) => p.id !== proposalId));
      refreshCounts(); // Actualizar contadores después de eliminar
    } catch (error) {
      console.error("Error al eliminar la propuesta:", error);
      setErrorModal({
        open: true,
        message: "No se pudo eliminar la propuesta. Intenta de nuevo.",
      });
    }
  };

  // Funciones de selección y eliminación de conversaciones
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedConversations([]);
  };

  const toggleConversationSelection = (convId) => {
    setSelectedConversations((prev) => {
      if (prev.includes(convId)) {
        return prev.filter((id) => id !== convId);
      }
      return [...prev, convId];
    });
  };

  const handleDeleteSingleConversation = (convId) => {
    setModal({
      open: true,
      action: "delete-conversation",
      text: "¿Estás seguro de que deseas eliminar esta conversación?",
      onConfirm: async () => {
        try {
          await deleteConversation(convId);
          if (activeId === convId) {
            setActiveId(null);
          }
        } catch (error) {
          console.error("Error al eliminar la conversación:", error);
        } finally {
          setModal((m) => ({ ...m, open: false }));
        }
      },
    });
  };

  const handleDeleteSelectedConversations = () => {
    if (selectedConversations.length === 0) return;

    setModal({
      open: true,
      action: "delete-conversations",
      text: `¿Estás seguro de que deseas eliminar ${selectedConversations.length} conversación(es)?`,
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedConversations.map((convId) => deleteConversation(convId)),
          );
          if (selectedConversations.includes(activeId)) {
            setActiveId(null);
          }
          setSelectedConversations([]);
          setSelectionMode(false);
        } catch (error) {
          console.error("Error al eliminar conversaciones:", error);
        } finally {
          setModal((m) => ({ ...m, open: false }));
        }
      },
    });
  };

  // Memoización de las conversaciones filtradas
  const conversationsForUser = useMemo(() => {
    if (!myEmail) {
      return [];
    }

    const term = search.trim().toLowerCase();
    const list = conversations
      .filter((conv) => {
        if (!conv || !Array.isArray(conv.participants)) {
          return false;
        }
        return conv.participants.includes(myEmail);
      })
      .map((conv) => {
        const otherParticipant =
          conv.participants.find((p) => p !== myEmail) || myEmail;
        const otherUser = conv.participants_data?.find(
          (p) => p.email === otherParticipant,
        );

        const lastReadTime = conv.lastReadAt?.[user.id] || 0;
        const unread =
          Array.isArray(conv.messages) &&
          conv.messages.some((m) => {
            const isFromOther = m.sender !== myEmail;
            const messageTime = new Date(m.createdAt).getTime();
            return isFromOther && messageTime > lastReadTime;
          });

        const listing = conv.listingId ? byId(conv.listingId) : null;

        return {
          ...conv,
          other: otherParticipant,
          otherName: otherUser?.name || otherParticipant.split("@")[0],
          otherUser,
          listing,
          unread,
        };
      });

    if (!term) return list;
    return list.filter(
      (conv) =>
        (conv.otherName && conv.otherName.toLowerCase().includes(term)) ||
        (conv.listing && conv.listing.name.toLowerCase().includes(term)),
    );
  }, [byId, conversations, myEmail, search, user?.id]);

  // Conversación activa
  const activeConversation = useMemo(() => {
    if (!activeId) return null;
    return conversationsForUser.find((conv) => conv.id === activeId) || null;
  }, [activeId, conversationsForUser]);

  // Manejador para enviar mensajes
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!draft.trim() && draftAttachments.length === 0) || !activeConversation)
      return;
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }

    try {
      await sendMessageAction(
        activeConversation.id,
        myEmail,
        draft,
        draftAttachments,
      );
      setDraft("");
      setDraftAttachments([]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setErrorModal({
        open: true,
        message: "No se pudo enviar el mensaje. Intenta de nuevo.",
      });
    }
  };

  // Manejador para adjuntar archivos
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                src: reader.result,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }),
      );
      setDraftAttachments((prev) => [...prev, ...uploads]);
      e.target.value = "";
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      alert("No se pudo cargar el archivo. Intenta de nuevo.");
      e.target.value = "";
    }
  };

  const removeAttachment = (id) => {
    setDraftAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Renderizado base
  if (!user) {
    return <main className="container page">No autorizado.</main>;
  }

  // Renderizado principal
  return (
    <main
      className={`container page inbox-page${activeId ? " has-active-chat" : ""}`}
    >
      <div
        className={`inbox-page-header ${isMobile && activeId ? "hidden" : ""}`}
      >
        <h1 className="inbox-page-title">Mensajes y propuestas</h1>
        <div className="inbox-nav-wrapper">
          <InboxNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {!isVerified && (
        <section className="panel verification-banner">
          <div className="verification-banner-content">
            <div className="verification-banner-icon">🔒</div>
            <div className="verification-banner-text">
              <h3>Verificación requerida</h3>
              <p>
                Para enviar mensajes y participar en intercambios, necesitas
                verificar tu identidad. Esto ayuda a mantener la plataforma
                segura.
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

      {activeTab === "messages" ? (
        <div className="inbox-shell">
          <section
            className={`conversation-list ${isMobile && activeId ? "hidden" : ""}`}
          >
            <div className="list-header">
              <div className="list-header-top">
                <h2>Conversaciones</h2>
                <button
                  className="btn-selection-mode"
                  onClick={toggleSelectionMode}
                  title={
                    selectionMode ? "Cancelar selección" : "Seleccionar chats"
                  }
                >
                  {selectionMode ? <MdClose /> : "Seleccionar"}
                </button>
              </div>
              {selectionMode && selectedConversations.length > 0 && (
                <div className="list-header-delete-bar">
                  <button
                    className="btn-delete-selected"
                    onClick={handleDeleteSelectedConversations}
                    title={`Eliminar ${selectedConversations.length} chat(s)`}
                  >
                    <MdDelete /> Eliminar ({selectedConversations.length})
                  </button>
                </div>
              )}
              {!selectionMode && (
                <>
                  <input
                    className="input"
                    placeholder="Buscar por usuario o publicación"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <div className="inbox-legend">
                    <span className="inbox-legend-item">
                      <span className="inbox-legend-indicator my-listing"></span>
                      <span className="inbox-legend-text">Mi publicación</span>
                    </span>
                    <span className="inbox-legend-item">
                      <span className="inbox-legend-indicator other-listing"></span>
                      <span className="inbox-legend-text">
                        Otra publicación
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="list-scroller" role="list">
              {conversationsForUser.length === 0 ? (
                <div className="list-empty">
                  No hay conversaciones todavía. Escribe a un vendedor desde un
                  anuncio.
                </div>
              ) : (
                conversationsForUser.map((conv) => {
                  const isMyListing = conv.listing?.ownerId === user?.id;
                  const isSwap = !!conv.swapInfo;
                  return (
                    <div
                      key={conv.id}
                      className={`inbox-card${activeId === conv.id ? " active" : ""}${conv.unread ? " message-new" : ""}${selectionMode ? " selection-mode" : ""}${selectedConversations.includes(conv.id) ? " selected" : ""}${isMyListing ? " my-listing" : " other-listing"}`}
                      onClick={() => {
                        if (selectionMode) {
                          toggleConversationSelection(conv.id);
                        } else {
                          setActiveId(conv.id);
                          markConversationAsRead(conv.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {selectionMode && (
                        <div className="inbox-card-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedConversations.includes(conv.id)}
                            onChange={() =>
                              toggleConversationSelection(conv.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className="seller-photo-wrapper">
                        <img
                          src={
                            conv.listing?.images?.[0] ||
                            "/images/placeholder.jpg"
                          }
                          alt={
                            conv.listing
                              ? `Imagen de ${conv.listing.name}`
                              : "Imagen del artículo"
                          }
                          className="seller-photo"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/placeholder.jpg";
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="inbox-card-body">
                        <div className="inbox-card-header">
                          <span className="inbox-card-name">
                            {conv.otherName}
                          </span>
                        </div>
                        {conv.listing && (
                          <div className="inbox-card-listing">
                            {conv.listing.name}
                          </div>
                        )}
                        {isSwap && (
                          <div className="inbox-card-swap-label">
                            Chat de intercambio
                          </div>
                        )}
                        {conv.messages && conv.messages.length > 0 && (
                          <div className="inbox-card-preview">
                            {conv.messages[conv.messages.length - 1].body ||
                              (conv.messages[conv.messages.length - 1]
                                .attachments?.length > 0
                                ? "📎 Imagen"
                                : "...")}
                          </div>
                        )}
                      </div>
                      {!selectionMode && (
                        <button
                          className="btn-delete-conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSingleConversation(conv.id);
                          }}
                          title="Eliminar conversación"
                        >
                          <MdDelete />
                        </button>
                      )}
                      {conv.unread && <span className="inbox-card-unread" />}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section
            className={`conversation-thread ${isMobile && !activeId ? "hidden" : ""}`}
          >
            {activeConversation ? (
              <div className="thread">
                {/* Header con info del usuario, publicación y toolbar de acciones */}
                <div className="thread-header-enhanced">
                  {isMobile && (
                    <button
                      className="thread-back"
                      onClick={() => setActiveId(null)}
                      aria-label="Volver a la lista"
                    >
                      ←
                    </button>
                  )}

                  <div className="thread-header-info">
                    <div className="thread-user-info">
                      <div className="thread-avatar-container">
                        {activeConversation.otherUser?.avatar ? (
                          <img
                            src={activeConversation.otherUser.avatar}
                            alt={activeConversation.otherName}
                            className="thread-avatar-large-img"
                            onError={(e) => {
                              // Si falla la carga, mostrar el avatar con inicial
                              e.target.style.display = "none";
                              const fallback = document.createElement("div");
                              fallback.className = "thread-avatar-large";
                              fallback.textContent =
                                activeConversation.otherName
                                  ?.charAt(0)
                                  .toUpperCase() || "?";
                              e.target.parentNode.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="thread-avatar-large">
                            {activeConversation.otherName
                              ?.charAt(0)
                              .toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="thread-user-details">
                        <div className="thread-name-large">
                          {activeConversation.otherName}
                        </div>
                        {activeConversation.listing && (
                          <div className="thread-listing-info">
                            <div className="thread-listing-name">
                              <MdInventory2 /> {activeConversation.listing.name}
                            </div>
                            <button
                              className="btn-view-listing"
                              onClick={() =>
                                navigate(
                                  `/item/${activeConversation.listing.id}`,
                                )
                              }
                              title="Ver publicación"
                            >
                              <MdOpenInNew /> Ver
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toolbar de acciones secundarias en el header */}
                    <div className="thread-actions-header">
                      <button
                        className="btn-action-header"
                        onClick={() => {
                          if (window.confirm("¿Bloquear a este usuario?")) {
                            blockParticipant(
                              activeConversation.id,
                              activeConversation.other,
                            );
                          }
                        }}
                        title="Bloquear usuario"
                      >
                        <MdBlock />
                      </button>
                      <button
                        className="btn-action-header"
                        onClick={() =>
                          alert("Función de reportar próximamente")
                        }
                        title="Reportar usuario"
                      >
                        <MdFlag />
                      </button>
                      <button
                        className="btn-action-header danger"
                        onClick={() => {
                          if (window.confirm("¿Eliminar esta conversación?")) {
                            deleteConversation(activeConversation.id);
                            setActiveId(null);
                          }
                        }}
                        title="Eliminar conversación"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>

                  {/* Botón destacado de marcar como vendido - SOLO PARA EL DUEÑO DE LA PUBLICACIÓN */}
                  {activeConversation.listing?.ownerId === user?.id && (
                    <button
                      className="btn-mark-sold"
                      onClick={() => {
                        setMarkSoldModal({
                          open: true,
                          listing: activeConversation.listing,
                        });
                      }}
                      title="Marcar como vendido"
                    >
                      <MdCheckCircle /> Marcar como vendido
                    </button>
                  )}
                </div>

                {/* Info de la propuesta de intercambio si existe */}
                {activeConversation.swapInfo && (
                  <div className="swap-info-box">
                    <h4>Propuesta de intercambio aceptada</h4>
                    <div>
                      <b>Artículo ofrecido:</b>{" "}
                      {activeConversation.swapInfo.offeredItem?.description ||
                        "Sin descripción"}
                    </div>
                    {activeConversation.swapInfo.message && (
                      <div>
                        <b>Mensaje:</b> {activeConversation.swapInfo.message}
                      </div>
                    )}
                    {activeConversation.swapInfo.cashAmount > 0 && (
                      <div>
                        <b>Dinero adicional:</b> $
                        {activeConversation.swapInfo.cashAmount} (
                        {activeConversation.swapInfo.cashDirection})
                      </div>
                    )}
                  </div>
                )}
                {/* Mensajes */}
                <div className="thread-messages">
                  {activeConversation.messages?.length === 0 ? (
                    <div className="thread-empty">No hay mensajes todavía.</div>
                  ) : (
                    activeConversation.messages?.map((msg) => {
                      const mine = msg.sender === myEmail;
                      return (
                        <div
                          key={msg.id}
                          className={`thread-message ${mine ? "mine" : ""}`}
                        >
                          {msg.attachments?.length > 0 && (
                            <div className="thread-message-images">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className="thread-message-image">
                                  <img
                                    src={att.src}
                                    alt={att.name || "Imagen"}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.body && (
                            <div className="thread-message-body">
                              {msg.body}
                            </div>
                          )}
                          <span className="thread-message-meta">
                            {mine ? "Tú" : activeConversation.otherName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Composer fijo en la parte inferior */}
                <div className="thread-composer-fixed">
                  {/* Preview de adjuntos */}
                  {draftAttachments.length > 0 && (
                    <div className="attachment-preview">
                      {draftAttachments.map((att) => (
                        <div key={att.id} className="attachment-item">
                          <img src={att.src} alt={att.name} />
                          <button
                            type="button"
                            className="remove-attachment"
                            onClick={() => removeAttachment(att.id)}
                            aria-label="Eliminar adjunto"
                          >
                            <MdClose />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Barra de botones pequeña arriba del input */}
                  <div className="composer-actions-bar">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn-composer-action"
                      title="Adjuntar imagen"
                    >
                      <MdAttachFile />
                    </label>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="btn-composer-action primary"
                      disabled={
                        (!draft.trim() && draftAttachments.length === 0) ||
                        !isVerified
                      }
                      title="Enviar mensaje"
                    >
                      <MdSend />
                    </button>
                  </div>

                  {/* Input de texto ancho completo */}
                  <form
                    className="thread-composer"
                    onSubmit={handleSendMessage}
                  >
                    <textarea
                      className="input-full-width"
                      placeholder="Escribe un mensaje..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </form>
                </div>
              </div>
            ) : (
              <div className="thread-placeholder">
                Selecciona una conversación para ver los mensajes.
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="swap-proposals-container">
          <SwapProposals
            proposals={swapProposals}
            currentUserId={user?.id}
            onDelete={handleDeleteSwap}
          />
        </div>
      )}

      <ConfirmModal
        open={modal.open}
        text={modal.text}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onConfirm={modal.onConfirm}
      />
      <ErrorModal
        open={errorModal.open}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, message: "" })}
      />
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onStartVerification={() => {
          setShowVerificationModal(false);
          navigate("/profile");
        }}
      />
      <MarcarComoVendidoModal
        listing={markSoldModal.listing}
        isOpen={markSoldModal.open}
        onClose={() => setMarkSoldModal({ open: false, listing: null })}
        onSuccess={async () => {
          // Enviar mensaje automático después de marcar como vendido
          try {
            await sendMessageAction(
              activeConversation.id,
              myEmail,
              "✅ Venta completada. Gracias por tu calificación. Puedes ver todas tus calificaciones en tu perfil.",
              [],
            );
          } catch (error) {
            console.error("Error al enviar mensaje automático:", error);
          }
          setMarkSoldModal({ open: false, listing: null });
        }}
      />
    </main>
  );
}

export default InboxPage;
