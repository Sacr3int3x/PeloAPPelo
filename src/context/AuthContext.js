import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { read, write } from "../utils/helpers";
import { LS } from "../utils/constants";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read(LS.user, null));
  const [users, setUsers] = useState(() => read(LS.users, []));

  useEffect(() => {
    write(LS.users, users);
  }, [users]);

  const login = useCallback(
    ({ identifier, password }) => {
      const normalizedId = identifier.trim().toLowerCase();
      const record = users.find(
        (u) => u.email === normalizedId || u.username === normalizedId,
      );
      if (!record) {
        return {
          success: false,
          error: "No encontramos una cuenta con esos datos.",
        };
      }
      if (record.password !== password) {
        return { success: false, error: "Clave incorrecta." };
      }
      const profile = {
        email: record.email,
        name: record.name,
        location: record.location,
        since: record.since,
        username: record.username,
        phone: record.phone,
      };
      setUser(profile);
      write(LS.user, profile);
      return { success: true, user: profile };
    },
    [users],
  );

  const register = useCallback(
    ({ email, password, name, location, username, phone }) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalizedEmail)) {
        return {
          success: false,
          error: "Ya existe una cuenta registrada con este correo.",
        };
      }
      const normalizedUsername = (username || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      if (!normalizedUsername) {
        return {
          success: false,
          error: "Escoge un nombre de usuario.",
        };
      }
      if (users.some((u) => u.username === normalizedUsername)) {
        return {
          success: false,
          error: "Ese nombre de usuario ya está en uso.",
        };
      }
      const providedName = (name || "").trim();
      const displayName =
        providedName || normalizedEmail.split("@")[0] || "Usuario";
      const record = {
        email: normalizedEmail,
        password,
        name: displayName,
        location,
        since: new Date().toISOString(),
        username: normalizedUsername,
        phone: phone?.trim() || "",
      };
      const profile = {
        email: record.email,
        name: record.name,
        location: record.location,
        since: record.since,
        username: record.username,
        phone: record.phone,
      };
      setUsers((prev) => [...prev, record]);
      setUser(profile);
      write(LS.user, profile);
      return { success: true, user: profile };
    },
    [users],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LS.user);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, register }),
    [user, login, logout, register],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
