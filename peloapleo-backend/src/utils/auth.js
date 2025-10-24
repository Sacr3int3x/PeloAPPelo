export function extractToken(req) {
  const header = req.headers.authorization || "";
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return header;
}
