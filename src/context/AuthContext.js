import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest } from "../services/api";
import { realtime } from "../services/realtime";
import { LS } from "../utils/constants";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(LS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(LS.token));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(() => Boolean(token) && !user);
  const initRequested = useRef(false);

  const persistSession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) localStorage.setItem(LS.token, nextToken);
    else localStorage.removeItem(LS.token);
    if (nextUser) localStorage.setItem(LS.user, JSON.stringify(nextUser));
    else localStorage.removeItem(LS.user);
  }, []);

  useEffect(() => {
    if (!token || user || initRequested.current) return;
    initRequested.current = true;
    let active = true;
    (async () => {
      try {
        const response = await apiRequest("/auth/me", { token });
        if (active) {
          persistSession(response.user, token);
        }
      } catch (error) {
        console.warn("Fallo obteniendo sesión", error);
        if (active) {
          persistSession(null, null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token, user, persistSession]);

  useEffect(() => {
    realtime.start();
    return () => {
      realtime.stop();
    };
  }, []);

  useEffect(() => {
    realtime.setToken(token);
  }, [token]);

  const login = useCallback(
    async ({ identifier, password }) => {
      try {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          data: { identifier, password },
        });
        persistSession(response.user, response.token);
        return { success: true, user: response.user };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo iniciar sesión.",
        };
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async ({ email, password, name, location, username, phone }) => {
      try {
        const response = await apiRequest("/auth/register", {
          method: "POST",
          data: { email, password, name, location, username, phone },
        });
        persistSession(response.user, response.token);
        return { success: true, user: response.user };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo completar el registro.",
        };
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    if (!token) {
      persistSession(null, null);
      return;
    }
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        token,
      });
    } catch (error) {
      console.warn("Error cerrando sesión", error);
    } finally {
      persistSession(null, null);
    }
  }, [token, persistSession]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      // Usar el nuevo endpoint para refrescar el token
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        token,
      });
      persistSession(response.user, response.token);
      return { success: true };
    } catch (error) {
      console.error("Error actualizando datos del usuario:", error);
      if (error?.status === 401) {
        persistSession(null, null);
      }
      return {
        success: false,
        error:
          error?.message || "No se pudo actualizar la información del usuario",
      };
    }
  }, [token, persistSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, token, loading, login, register, logout, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
