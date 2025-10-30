import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest, buildImageUrl } from "../services/api";
import { realtime } from "../services/realtime";
import { useAuth } from "./AuthContext";
import { read, write } from "../utils/helpers";
import { LS } from "../utils/constants";

// Funciones auxiliares globales
const normalizeImages = (images) => {
  if (Array.isArray(images)) {
    return images.map((src) => buildImageUrl(src));
  }
  return [];
};

const withNormalizedImages = (item) => {
  if (!item) return item;
  return {
    ...item,
    images: normalizeImages(item.images),
  };
};

// Hook para detectar si el usuario está en escritorio
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    const isPC =
      ua.includes("windows") ||
      ua.includes("macintosh") ||
      ua.includes("linux");
    return isPC || window.innerWidth >= 1024;
  });
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isDesktop;
}

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);

export function DataProvider({ children }) {
  const isDesktop = useIsDesktop();
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const [favoriteItems, setFavoriteItems] = useState(() => new Map());
  const [searches, setSearches] = useState(() => read(LS.searches, []));

  useEffect(() => {
    write(LS.searches, searches);
  }, [searches]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/listings");
      const normalized = (response.items || []).map(withNormalizedImages);
      setItems(normalized);
    } catch (error) {
      console.error("No se pudieron cargar las publicaciones", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    // Suscripción a eventos realtime para crear/actualizar publicaciones
    const handleCreate = (event) => {
      const next = withNormalizedImages(event.detail?.item);
      if (!next) return;
      if (
        ["removed", "suspended"].includes((next.status || "").toLowerCase())
      ) {
        return;
      }
      setItems((prev) => {
        if (prev.some((item) => String(item.id) === String(next.id))) {
          return prev;
        }
        return [next, ...prev];
      });
    };

    const handleUpdate = (event) => {
      const next = withNormalizedImages(event.detail?.item);
      if (!next) return;
      const key = String(next.id);
      const moderated = ["removed", "suspended"].includes(
        (next.status || "").toLowerCase(),
      );
      setItems((prev) => {
        if (moderated) {
          return prev.filter((item) => String(item.id) !== key);
        }
        const exists = prev.some((item) => String(item.id) === key);
        const updated = prev.map((item) =>
          String(item.id) === key ? next : item,
        );
        return exists ? updated : [next, ...prev];
      });
      setFavoriteItems((prev) => {
        if (moderated) {
          if (!prev.has(key)) return prev;
          const map = new Map(prev);
          map.delete(key);
          return map;
        }
        if (!prev.has(key)) return prev;
        const map = new Map(prev);
        map.set(key, next);
        return map;
      });
    };

    const offCreate = realtime.on("listing.created", handleCreate);
    const offUpdate = realtime.on("listing.updated", handleUpdate);

    return () => {
      offCreate();
      offUpdate();
    };
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const status = (item.status || "").toLowerCase();
      if (["removed", "suspended"].includes(status)) return false;
      if (["sold", "finalizado", "finalized"].includes(status)) {
        if (!user) return false;
        const ownerId = String(item.ownerId || "").toLowerCase();
        const userId = String(user?.id || "").toLowerCase();
        const ownerEmail = String(item.ownerEmail || "").toLowerCase();
        const userEmail = String(user?.email || "").toLowerCase();
        if (ownerId && userId && ownerId === userId) return true;
        if (ownerEmail && userEmail && ownerEmail === userEmail) return true;
        return false;
      }
      return true;
    });
  }, [items, user]);

  const create = useCallback(
    async (payload) => {
      if (!token) {
        return {
          success: false,
          error: "Debes iniciar sesión para publicar.",
        };
      }
      try {
        const response = await apiRequest("/listings", {
          method: "POST",
          data: payload,
          token,
        });
        const item = withNormalizedImages(response.item);
        setItems((prev) => {
          if (prev.some((i) => String(i.id) === String(item.id))) {
            return prev;
          }
          return [item, ...prev];
        });
        return { success: true, item };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo crear la publicación.",
        };
      }
    },
    [token],
  );

  const updateStatus = useCallback(
    async (id, status) => {
      if (!token) {
        return {
          success: false,
          error: "Debes iniciar sesión.",
        };
      }
      try {
        const response = await apiRequest(`/listings/${id}/status`, {
          method: "PATCH",
          data: { status },
          token,
        });
        const updated = withNormalizedImages(response.item);
        setItems((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? updated : item)),
        );
        setFavoriteItems((prev) => {
          if (!prev.has(String(id))) return prev;
          const next = new Map(prev);
          next.set(String(id), updated);
          return next;
        });
        return { success: true, item: updated };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo actualizar el estado.",
        };
      }
    },
    [token],
  );

  const deleteListing = useCallback(
    async (id) => {
      if (!token) {
        return {
          success: false,
          error: "Debes iniciar sesión.",
        };
      }
      try {
        const key = String(id);
        await apiRequest(`/listings/${key}`, {
          method: "DELETE",
          token,
        });
        setItems((prev) => prev.filter((item) => String(item.id) !== key));
        setFavoriteItems((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        return { success: true };
      } catch (error) {
        console.error("Error al eliminar:", error);
        return {
          success: false,
          error: error?.message || "No se pudo eliminar la publicación.",
        };
      }
    },
    [token],
  );

  const updateListing = useCallback(
    async (id, updates) => {
      if (!token) {
        return {
          success: false,
          error: "Debes iniciar sesión.",
        };
      }
      try {
        // Actualizar la publicación con los nuevos datos
        await apiRequest(`/listings/${id}`, {
          method: "PATCH",
          data: {
            name: updates.name,
            description: updates.description,
          },
          token,
        });

        // Si hay imágenes nuevas, actualizarlas
        if (updates.newImages && updates.newImages.length > 0) {
          const formData = new FormData();
          updates.newImages.forEach((file) => {
            formData.append("images", file);
          });

          await apiRequest(`/listings/${id}/upload`, {
            method: "POST",
            body: formData,
            isFormData: true,
            token,
          });
        }

        const result = await apiRequest(`/listings/${id}`, {
          method: "GET",
          token,
        });

        const updated = withNormalizedImages(result.item);
        setItems((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? updated : item)),
        );
        return { success: true, item: updated };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo actualizar la publicación.",
        };
      }
    },
    [token],
  );

  const byCategory = useCallback(
    (category) =>
      visibleItems.filter((item) => String(item.category) === String(category)),
    [visibleItems],
  );

  const byId = useCallback(
    (id) => visibleItems.find((item) => String(item.id) === String(id)) || null,
    [visibleItems],
  );

  const byOwner = useCallback(
    (owner) => {
      const normalized = String(owner || "").toLowerCase();
      if (!normalized) return [];

      // Si el usuario está bloqueado, no mostrar las publicaciones
      if (user?.email) {
        const { blocked = {} } = window?.__REALTIME_STATE__ || {};
        const ownerBlockedUsers = blocked[normalized] || [];
        const myBlockedUsers = blocked[user.email] || [];

        // Si hay un bloqueo mutuo, no mostrar las publicaciones
        if (
          ownerBlockedUsers.includes(user.email) ||
          myBlockedUsers.includes(normalized)
        ) {
          console.log("Usuario bloqueado, no se muestran publicaciones:", {
            viewer: user.email,
            owner: normalized,
            isBlockedByOwner: ownerBlockedUsers.includes(user.email),
            hasBlockedOwner: myBlockedUsers.includes(normalized),
          });
          return [];
        }
      }

      return items.filter((item) => {
        const email = String(item.ownerEmail || "").toLowerCase();
        const username = String(item.ownerUsername || "").toLowerCase();
        const ownerId = String(item.ownerId || "").toLowerCase();
        return (
          normalized === email ||
          normalized === username ||
          normalized === ownerId
        );
      });
    },
    [items, user],
  );

  const isFav = useCallback((id) => favorites.has(String(id)), [favorites]);

  const favItems = useMemo(() => {
    const combined = new Map(favoriteItems);
    visibleItems.forEach((item) => {
      const key = String(item.id);
      if (favorites.has(key)) {
        combined.set(key, item);
      }
    });
    return Array.from(combined.values());
  }, [favoriteItems, favorites, visibleItems]);

  const toggleFav = useCallback(
    async (id) => {
      if (!token) {
        return {
          success: false,
          error: "Debes iniciar sesión para guardar favoritos.",
        };
      }
      const key = String(id);
      const liked = favorites.has(key);
      try {
        if (liked) {
          await apiRequest(`/listings/${id}/favorite`, {
            method: "DELETE",
            token,
          });
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setFavoriteItems((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        } else {
          await apiRequest(`/listings/${id}/favorite`, {
            method: "POST",
            token,
          });
          setFavorites((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
          });
          setFavoriteItems((prev) => {
            if (prev.has(key)) return prev;
            const listing =
              items.find((item) => String(item.id) === key) || null;
            if (!listing) return prev;
            const next = new Map(prev);
            next.set(key, listing);
            return next;
          });
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo actualizar el favorito.",
        };
      }
    },
    [token, favorites, items],
  );

  const trackSearch = useCallback((term) => {
    setSearches((prev) => {
      const normalized = term.trim().toLowerCase();
      if (!normalized) return prev;
      const existing = prev.filter((value) => value !== normalized);
      return [normalized, ...existing].slice(0, 10);
    });
  }, []);

  const value = useMemo(
    () => ({
      items: visibleItems,
      allItems: items,
      loading,
      create,
      byCategory,
      byId,
      byOwner,
      favItems,
      favorites,
      isFav,
      toggleFav,
      trackSearch,
      searches,
      updateStatus,
      updateListing,
      deleteListing,
      refresh: fetchListings,
      user,
      isDesktop,
    }),
    [
      visibleItems,
      items,
      loading,
      create,
      byCategory,
      byId,
      byOwner,
      favItems,
      favorites,
      isFav,
      toggleFav,
      trackSearch,
      searches,
      updateStatus,
      updateListing,
      deleteListing,
      fetchListings,
      user,
      isDesktop,
    ],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
