import { apiRequest } from "./api";

const toQueryString = (params = {}) => {
  const entries = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      if (typeof value === "number") return [key, value];
      return [key, String(value)];
    });
  if (!entries.length) return "";
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
};

export function fetchAdminOverview(token) {
  return apiRequest("/admin/overview", { token });
}

export function fetchAdminUsers(token, params = {}) {
  return apiRequest(`/admin/users${toQueryString(params)}`, { token });
}

export function updateAdminUser(token, userId, payload) {
  return apiRequest(`/admin/users/${userId}`, {
    method: "PATCH",
    token,
    data: payload,
  });
}

export function fetchAdminListings(token, params = {}) {
  return apiRequest(`/admin/listings${toQueryString(params)}`, { token });
}

export function updateAdminListing(token, listingId, payload) {
  return apiRequest(`/admin/listings/${listingId}`, {
    method: "PATCH",
    token,
    data: payload,
  });
}

export function deleteAdminListing(token, listingId) {
  return apiRequest(`/admin/listings/${listingId}`, {
    method: "DELETE",
    token,
  });
}

export function pauseAdminListing(token, listingId) {
  return apiRequest(`/admin/listings/${listingId}/pause`, {
    method: "POST",
    token,
  });
}

export function fetchAdminConversations(token, params = {}) {
  return apiRequest(`/admin/conversations${toQueryString(params)}`, { token });
}

export function fetchAdminAudit(token, params = {}) {
  return apiRequest(`/admin/audit${toQueryString(params)}`, { token });
}

export function fetchAdminRaw(token) {
  return apiRequest("/admin/raw", { token });
}
