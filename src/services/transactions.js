import { apiRequest } from "./api";

// Funciones para propuestas de intercambio
export function createSwapProposal(itemId, proposal, token) {
  return apiRequest(`/listings/${itemId}/swap`, {
    method: "POST",
    token,
    data: proposal,
  });
}

export function fetchSwapProposals(token) {
  return apiRequest("/transactions/swaps", { token });
}

export function acceptSwapProposal(proposalId, token) {
  return apiRequest(`/transactions/swaps/${proposalId}/accept`, {
    method: "POST",
    token,
  });
}

export function rejectSwapProposal(proposalId, token, reason) {
  return apiRequest(`/transactions/swaps/${proposalId}/reject`, {
    method: "POST",
    token,
    data: { reason },
  });
}

export function cancelSwapProposal(proposalId, token) {
  return apiRequest(`/transactions/swaps/${proposalId}/cancel`, {
    method: "POST",
    token,
  });
}

export function deleteSwapProposal(proposalId, token) {
  return apiRequest(`/transactions/swaps/${proposalId}`, {
    method: "DELETE",
    token,
  });
}

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
