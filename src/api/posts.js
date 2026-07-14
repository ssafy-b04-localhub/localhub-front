import api from "./index.js";

export async function listPosts() {
  const res = await api.get("/posts");
  return res.data; // array of posts
}

export async function createPost({ title, content, password }) {
  const res = await api.post("/posts", { title, content, password });
  return res.data;
}

export async function updatePost(postId, { title, content, password }) {
  const res = await api.put(`/posts/${postId}`, { title, content, password });
  return res.data;
}

export async function deletePost(postId, password) {
  // backend expects ?password=...
  const res = await api.delete(`/posts/${postId}`, { params: { password } });
  return res.data;
}

// Backend has no GET /posts/{id}, so fetch all and find by id
export async function getPost(postId) {
  const posts = await listPosts();
  const id = typeof postId === "string" ? Number(postId) : postId;
  return posts.find((p) => Number(p.id) === Number(id)) || null;
}

/**
 * Verify post password (optional helper).
 * NOTE: Backend currently does not implement this endpoint.
 * When backend implements POST /posts/{postId}/verify-password,
 * this function should be used by the frontend to verify password before edit.
 *
 * Expected backend request:
 *   POST /posts/{postId}/verify-password
 *   { "password": "..." }
 *
 * Expected response:
 *   { "verified": true }  // 200 OK when verified
 *
 * If backend returns 4xx (Unauthorized/Bad Request) with { detail: "..." },
 * the caller should surface the error message.
 */
export async function verifyPostPassword(postId, password) {
  const res = await api.post(`/posts/${postId}/verify-password`, { password });
  return res.data;
}
