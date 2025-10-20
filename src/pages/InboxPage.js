import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  FaArrowLeft,
  FaBan,
  FaPaperclip,
  FaPaperPlane,
  FaTrashAlt,
  FaUnlock,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { useData } from "../context/DataContext";
import "../styles/InboxPage.css";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        src: reader.result,
        name: file.name,
        mime: file.type || "image/jpeg",
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatTimestamp = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  return sameDay
    ? date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const avatarFromEmail = (email) => email?.charAt(0)?.toUpperCase() || "?";

function InboxPage() {
  const { user } = useAuth();
  const {
    conversations,
    sendMessage,
    deleteConversation,
    blockParticipant,
    unblockParticipant,
    isBlocked,
  } = useMessages();
  const { byId } = useData();

  const myEmail = user?.email || "";

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [messageError, setMessageError] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 960);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const conversationsForUser = useMemo(() => {
    if (!myEmail) return [];
    const term = search.trim().toLowerCase();
    const list = conversations
      .filter((conv) => conv.participants.includes(myEmail))
      .map((conv) => {
        const other = conv.participants.find((p) => p !== myEmail) || myEmail;
        const listing = conv.listingId ? byId(conv.listingId) : null;
        return {
          ...conv,
          other,
          listing,
        };
      })
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    if (!term) return list;
    return list.filter((conv) => {
      const otherMatch = conv.other.toLowerCase().includes(term);
      const listingMatch = conv.listing?.name
        ?.toLowerCase()
        .includes(term);
      return otherMatch || listingMatch;
    });
  }, [byId, conversations, myEmail, search]);

  useEffect(() => {
    if (!myEmail) return;
    if (!activeId && conversationsForUser.length) {
      setActiveId(conversationsForUser[0].id);
    } else if (
      activeId &&
      !conversationsForUser.some((conv) => conv.id === activeId)
    ) {
      const fallback = conversationsForUser[0];
      setActiveId(fallback ? fallback.id : null);
    }
  }, [activeId, conversationsForUser, myEmail]);

  useEffect(() => {
    setDraft("");
    setDraftAttachments([]);
    setMessageError("");
  }, [activeId]);

  const activeConversation = useMemo(
    () => conversationsForUser.find((conv) => conv.id === activeId) || null,
    [conversationsForUser, activeId],
  );

  const listHidden = isMobile && activeConversation;
  const threadHidden = isMobile && !activeConversation;

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remainingSlots = 6 - draftAttachments.length;
    const selected = files.slice(0, remainingSlots);
    try {
      const previews = await Promise.all(selected.map((file) => readFileAsDataUrl(file)));
      setDraftAttachments((prev) => [...prev, ...previews]);
    } catch (err) {
      console.error("Error leyendo adjuntos", err);
    }
  };

  const removeAttachment = (id) => {
    setDraftAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!activeConversation) return;
    const result = sendMessage(
      activeConversation.id,
      myEmail,
      draft,
      draftAttachments,
    );
    if (!result?.success) {
      setMessageError(result?.error || "No se pudo enviar el mensaje.");
      return;
    }
    setDraft("");
    setDraftAttachments([]);
  };

  const confirmDelete = useCallback(
    (conversationId) => {
      const confirmed = window.confirm(
        "¿Deseas eliminar esta conversación? Esta acción no se puede deshacer.",
      );
      if (confirmed) {
        deleteConversation(conversationId);
      }
    },
    [deleteConversation],
  );

  const toggleBlock = useCallback(
    (owner, target) => {
      const currentlyBlocked = isBlocked(owner, target);
      const message = currentlyBlocked
        ? "¿Quieres desbloquear a este usuario? Podrán volver a enviarte mensajes."
        : "¿Seguro que deseas bloquear a este usuario? No recibirás más mensajes suyos.";
      const confirmed = window.confirm(message);
      if (!confirmed) return;
      if (currentlyBlocked) {
        unblockParticipant(owner, target);
      } else {
        blockParticipant(owner, target);
      }
    },
    [blockParticipant, isBlocked, unblockParticipant],
  );

  const renderConversationCard = (conv) => {
    const lastMessage = conv.messages[conv.messages.length - 1];
    const preview = lastMessage?.body;
    const hasImages = Array.isArray(lastMessage?.attachments) && lastMessage.attachments.length > 0;
    const blockedByMe = isBlocked(myEmail, conv.other);
    const blockedText = blockedByMe ? "Usuario bloqueado" : null;
    return (
      <button
        key={conv.id}
        type="button"
        className={`inbox-card ${conv.id === activeId ? "active" : ""}`}
        onClick={() => setActiveId(conv.id)}
      >
        <div className="inbox-card-avatar" aria-hidden>
          {avatarFromEmail(conv.other)}
        </div>
        <div className="inbox-card-body">
          <div className="inbox-card-header">
            <span className="inbox-card-name">{conv.other.split("@")[0]}</span>
            <span className="inbox-card-date">{formatTimestamp(conv.updatedAt)}</span>
          </div>
          <div className="inbox-card-preview">
            {blockedText
              ? blockedText
              : hasImages && !preview
                ? "📷 Imagen enviada"
                : hasImages
                ? `📷 ${preview}`
                : preview || "Conversación sin mensajes"}
          </div>
          {conv.listing && (
            <div className="inbox-card-tags">
              <span>{conv.listing.name}</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  const renderThread = () => {
    if (!activeConversation) {
      return (
        <div className="thread-placeholder">
          <h3>Selecciona una conversación</h3>
          <p>Encuentra tus intercambios y continúa la negociación.</p>
        </div>
      );
    }

    const otherEmail = activeConversation.other;
    const listing = activeConversation.listing;
    const blockedByMe = isBlocked(myEmail, otherEmail);
    const blockedMe = isBlocked(otherEmail, myEmail);
    const composerDisabled = blockedByMe || blockedMe;

    return (
      <div className="thread">
        <header className="thread-header">
          {isMobile && (
            <button
              type="button"
              className="thread-back"
              onClick={() => setActiveId(null)}
            >
              <FaArrowLeft />
            </button>
          )}
          <div className="thread-user">
            <div className="thread-avatar" aria-hidden>
              {avatarFromEmail(otherEmail)}
            </div>
            <div>
              <div className="thread-name">{otherEmail.split("@")[0]}</div>
              <div className="thread-email">{otherEmail}</div>
            </div>
          </div>
          <div className="thread-toolbar">
            <button
              type="button"
              className="btn outline sm"
              onClick={() => toggleBlock(myEmail, otherEmail)}
            >
              {blockedByMe ? (
                <>
                  <FaUnlock /> Desbloquear
                </>
              ) : (
                <>
                  <FaBan /> Bloquear
                </>
              )}
            </button>
            <button
              type="button"
              className="btn outline sm danger"
              onClick={() => confirmDelete(activeConversation.id)}
            >
              <FaTrashAlt /> Borrar
            </button>
          </div>
        </header>

        {listing && (
          <div className="thread-listing">
            <div>
              <strong>{listing.name}</strong>
              <span>{listing.location}</span>
            </div>
            <a className="thread-listing-link" href={`#/item/${listing.id}`}>
              Ver publicación
            </a>
          </div>
        )}

        <div className="thread-messages" aria-live="polite">
          {activeConversation.messages.length === 0 ? (
            <div className="thread-empty">No hay mensajes todavía.</div>
          ) : (
            activeConversation.messages.map((msg) => {
              const mine = msg.sender === myEmail;
              const hasImages = Array.isArray(msg.attachments) && msg.attachments.length > 0;
              return (
                <div
                  key={msg.id}
                  className={`thread-message ${mine ? "mine" : ""}`}
                >
                  {hasImages && (
                    <div className="thread-message-images">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="thread-message-image"
                        >
                          <img src={att.src} alt={att.name || "Adjunto"} />
                        </a>
                      ))}
                    </div>
                  )}
                  {msg.body && (
                    <div className="thread-message-body">{msg.body}</div>
                  )}
                  <span className="thread-message-meta">
                    {mine ? "Tú" : otherEmail.split("@")[0]} · {formatTimestamp(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <form className="thread-composer" onSubmit={handleSend}>
          {composerDisabled && (
            <div className="thread-alert">
              {blockedByMe
                ? "Has bloqueado a este usuario. Desbloquéalo para continuar la conversación."
                : "Este usuario bloqueó la conversación. No puedes responder."}
            </div>
          )}

          {draftAttachments.length > 0 && (
            <div className="composer-attachments">
              {draftAttachments.map((att) => (
                <div key={att.id} className="composer-attachment">
                  <img src={att.src} alt={att.name} />
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => removeAttachment(att.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="composer-controls">
            <label className="attach-button">
              <FaPaperclip />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={composerDisabled}
              />
            </label>
            <textarea
              className="input"
              placeholder={
                composerDisabled
                  ? ""
                  : "Escribe un mensaje o adjunta imágenes"
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={ composerDisabled ? 2 : 3 }
              disabled={composerDisabled}
            />
            <button
              type="submit"
              className="btn primary"
              disabled={
                composerDisabled ||
                (!draft.trim() && draftAttachments.length === 0)
              }
            >
              <FaPaperPlane aria-hidden />
              <span>Enviar</span>
            </button>
          </div>
          {messageError && (
            <div className="field-error" role="alert">
              {messageError}
            </div>
          )}
        </form>
      </div>
    );
  };

  if (!user) {
    return <main className="container page">No autorizado.</main>;
  }

  return (
    <main className="container page inbox-page">
      <PageHeader title="Mensajes" />
      <div className="inbox-shell">
        <section className={`conversation-list ${listHidden ? "hidden" : ""}`}>
          <div className="list-header">
            <h2>Conversaciones</h2>
            <input
              className="input"
              placeholder="Buscar por usuario o publicación"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="list-scroller" role="list">
            {conversationsForUser.length === 0 ? (
              <div className="list-empty">
                No hay conversaciones todavía. Escribe a un vendedor desde un anuncio.
              </div>
            ) : (
              conversationsForUser.map(renderConversationCard)
            )}
          </div>
        </section>

        <section className={`conversation-thread ${threadHidden ? "hidden" : ""}`}>
          {renderThread()}
        </section>
      </div>
    </main>
  );
}

export default InboxPage;
