import { db } from "../store/db.js";

export async function authMiddleware({ req, res }) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token no proporcionado");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new Error("Token no válido");
  }

  // Buscar la sesión activa
  const session = db.data.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date(),
  );
  if (!session) {
    throw new Error("Sesión no válida o expirada");
  }

  // Buscar el usuario
  const user = db.data.users.find((u) => u.id === session.userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Agregar el usuario al request
  req.user = user;
  req.session = session;
}
