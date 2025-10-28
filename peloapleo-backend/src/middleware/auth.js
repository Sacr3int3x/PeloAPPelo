import { db } from "../store/db.js";

export async function authMiddleware({ req, res }) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    req.session = null;
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    req.session = null;
    return;
  }

  // Buscar la sesión activa
  const session = db.data.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date(),
  );
  if (!session) {
    req.user = null;
    req.session = null;
    return;
  }

  // Buscar el usuario
  const user = db.data.users.find((u) => u.id === session.userId);
  if (!user) {
    req.user = null;
    req.session = null;
    return;
  }

  // Agregar el usuario al request
  req.user = user;
  req.session = session;
}
