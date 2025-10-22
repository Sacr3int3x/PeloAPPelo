import { apiRequest } from "./api";

export function completeConversation(conversationId, token) {
  return apiRequest(`/conversations/${conversationId}/complete`, {
    method: "POST",
    token,
  });
}

export function submitReputation({ transactionId, rating, comment }, token) {
  return apiRequest("/reputations", {
    method: "POST",
    token,
    data: { transactionId, rating, comment },
  });
}

export function fetchMyReputations(token) {
  return apiRequest("/me/reputations", { token });
}

export function fetchReputationsForUser(userId, token) {
  return apiRequest(`/users/${userId}/reputations`, { token });
}

export function fetchAdminReputations(params, token) {
  const query = new URLSearchParams(params || {}).toString();
  const suffix = query ? `?${query}` : "";
  return apiRequest(`/admin/reputations${suffix}`, { token });
}
