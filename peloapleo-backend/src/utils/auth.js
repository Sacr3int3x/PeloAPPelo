export function extractToken(req) {
  const header = req.headers.authorization || "";
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return header;
}

export async function requireUser(token) {
  if (!token) {
    const error = new Error('No autorizado');
    error.statusCode = 401;
    throw error;
  }
  
  // Por ahora, un usuario simple. En una implementación real, verificaríamos el token
  // y obtendríamos el usuario de la base de datos
  return {
    id: 'usr_' + token.slice(0, 8),
    email: token + '@user.com'
  };
}
