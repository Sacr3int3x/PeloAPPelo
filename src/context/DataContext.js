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

const DataCtx = createContext(null);

export const useData = () => useContext(DataCtx);

const normalizeImages = (images) =>
  Array.isArray(images) ? images.map((src) => buildImageUrl(src)) : [];

const withNormalizedImages = (item) =>
  item
    ? {
        ...item,
        images: normalizeImages(item.images),
      }
    : item;

export function DataProvider({ children }) {
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
      let listings = response.items || response.listings || [];
      
      // Si no hay listados, cargar los demos
      if (listings.length === 0) {
        const { DEMO_LISTINGS } = await import('../data/demo');
        listings = DEMO_LISTINGS;
      }
      
      const normalized = listings.map(withNormalizedImages);
      setItems(normalized);
    } catch (error) {
      console.error("No se pudieron cargar las publicaciones", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!token) {
      setFavorites(new Set());
      setFavoriteItems(new Map());
      return;
    }
    try {
      const response = await apiRequest("/me/favorites", { token });
      const ids = new Set((response.ids || []).map(String));
      const favMap = new Map();
      (response.items || []).map(withNormalizedImages).forEach((item) => {
        favMap.set(String(item.id), item);
      });
      setFavorites(ids);
      setFavoriteItems(favMap);
    } catch (error) {
      console.error("Error obteniendo favoritos", error);
    }
  }, [token]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Efecto para manejar actualizaciones de bloqueos
  useEffect(() => {
    if (!user) return;

    const handleBlockUpdate = () => {
      // Forzar una actualización de los listados cuando cambian los bloqueos
      fetchListings();
    };

    // Suscribirse a eventos de bloqueo
    const offBlockUpdate = realtime.on('user.blocked', handleBlockUpdate);
    const offUnblockUpdate = realtime.on('user.unblocked', handleBlockUpdate);

    return () => {
      offBlockUpdate();
      offUnblockUpdate();
    };
  }, [user, fetchListings]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
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
    const currentUserEmail = user?.email?.toLowerCase();
    const { blockedUsers } = window.__BLOCK_CONTEXT__ || {};

    return items.filter((item) => {
      const status = (item.status || "").toLowerCase();
      
      // Primero verificar estados básicos
      if (["removed", "suspended"].includes(status)) return false;
      
      const ownerEmail = String(item.ownerEmail || "").toLowerCase();

      // Si no hay usuario logueado, mostrar todas las publicaciones activas
      if (!currentUserEmail) {
        return !["sold", "finalizado", "finalized"].includes(status);
      }

      // Verificar estado de venta
      if (["sold", "finalizado", "finalized"].includes(status)) {
        // Solo mostrar items finalizados al dueño
        return ownerEmail === currentUserEmail;
      }

      // Verificar bloqueos bidireccionales
      const blockInfo = blockedUsers?.get(ownerEmail);
      const amIBlockedByOwner = blockedUsers?.get(currentUserEmail)?.direction === 'incoming';
      
      if (blockInfo || amIBlockedByOwner) {
        console.log('Filtrando publicación por bloqueo:', {
          itemId: item.id,
          itemName: item.name,
          owner: ownerEmail,
          viewer: currentUserEmail,
          blockDirection: blockInfo?.direction,
          amIBlockedByOwner
        });
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
        setItems((prev) => [item, ...prev]);
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
      refresh: fetchListings,
      user,
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
      fetchListings,
      user,
    ],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
