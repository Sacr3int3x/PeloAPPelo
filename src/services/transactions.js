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

export function markSwapAsRead(proposalId, token) {
  return apiRequest(`/transactions/swaps/${proposalId}/read`, {
    method: "POST",
    token,
  });
}

export function completeConversation(conversationId, token) {
  return apiRequest(`/conversations/${conversationId}/complete`, {
    method: "POST",
    token,
  });
}

export function createTransaction(data, token) {
  return apiRequest("/transactions", {
    method: "POST",
    token,
    data: {
      listingId: data.listingId,
      buyerId: data.buyerId,
    },
  });
}

export function rateUser({ transactionId, toUserId, rating, comment }, token) {
  return apiRequest("/reputations", {
    method: "POST",
    token,
    data: { transactionId, toUserId, rating, comment },
  });
}

export function getUserReputation(userId, token) {
  return apiRequest(`/users/${userId}/reputation`, { token }).then(
    (response) => response.reputation,
  );
}

export function getUserReviews(userId, token) {
  return apiRequest(`/users/${userId}/reputation`, { token }).then(
    (response) => response.ratings || [],
  );
}

export function getPendingRatings(token) {
  return apiRequest("/me/pending-ratings", { token }).then(
    (response) => response.pendingRatings,
  );
}
