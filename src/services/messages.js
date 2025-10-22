import { apiRequest } from "./api";

export async function markConversationRead(conversationId, token) {
  return apiRequest(`/conversations/${conversationId}/read`, {
    method: "POST",
    token,
  });
}
