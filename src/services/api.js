const rawBase = process.env.REACT_APP_API_BASE?.trim();
const DEFAULT_BASE =
  rawBase && rawBase.length ? rawBase.replace(/\/+$/, "") : "/api";

export const API_BASE = DEFAULT_BASE;

function buildUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleaned}`;
}

function buildHeaders(token, hasBody) {
  const headers = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(
  path,
  { method = "GET", data, token, signal, body, isFormData } = {},
) {
  const url = buildUrl(path);
  const hasBody = data !== undefined && data !== null;
  const headers = buildHeaders(token, hasBody && !isFormData);

  // Si es FormData, no incluir Content-Type, el navegador lo establecerá automáticamente
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body || (hasBody ? JSON.stringify(data) : undefined),
    credentials: "include",
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.error || "Error en la solicitud.");
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }

  return payload;
}

export function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/images/")) return path;
  return `${API_BASE.replace(/\/api$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
