import api from "./index.js";

export async function postChat(payload) {
  // payload: { message: string, context?: any }
  // Backend endpoint may not exist; caller should handle errors.
  const res = await api.post("/api/chat", payload);
  return res.data;
}
