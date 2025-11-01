import { apiRequest } from "./api";

export async function markConversationRead(conversationId, token) {
  return apiRequest(`/conversations/${conversationId}/read`, {
    method: "POST",
    token,
  });
}

export async function getConversationParticipants(listingId, token) {
  // Fetch conversations for the listing and extract participants
  const conversations = await apiRequest(
    `/conversations?listingId=${listingId}`,
    { token },
  );
  const participants = [];
  const seen = new Set();
  conversations.forEach((conv) => {
    conv.participants.forEach((p) => {
      if (!seen.has(p.email)) {
        seen.add(p.email);
        participants.push(p);
      }
    });
  });
  return participants;
}
