import api from "./index.js";

export async function listPosts(params = {}) {
  // Backend currently ignores category_id/keyword, but passing params
  // is safe if backend later supports them. For now, we fetch all posts.
  const res = await api.get("/posts", { params });
  return res.data; // array of posts
}

export async function createPost({ title, content, password, category_id = null }) {
  const payload = { title, content, password, category_id };
  const res = await api.post("/posts", payload);
  return res.data;
}

export async function updatePost(postId, { title, content, password, category_id }) {
  const body = { password };
  if (title !== undefined) body.title = title;
  if (content !== undefined) body.content = content;
  if (category_id !== undefined) body.category_id = category_id;
  const res = await api.put(`/posts/${postId}`, body);
  return res.data;
}

export async function deletePost(postId, password) {
  const res = await api.delete(`/posts/${postId}`, { params: { password } });
  return res.data;
}

export async function getPost(postId) {
  const posts = await listPosts();
  const id = typeof postId === "string" ? Number(postId) : postId;
  return posts.find((p) => Number(p.id) === Number(id)) || null;
}

export async function verifyPostPassword(postId, password) {
  const res = await api.post(`/posts/${postId}/verify-password`, { password });
  return res.data;
}

/* ---------------------------
   댓글 관련 API (main.py에 맞춤)
   - GET  /posts/{post_id}/comments
   - POST /posts/{post_id}/comments  (body: { content, password })
   - PUT  /comments/{comment_id}     (body: { content?, password })
   - DELETE /comments/{comment_id}?password=...
   --------------------------- */

export async function listComments(postId) {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data; // expecting array of { id, post_id, content, created_at, updated_at }
}

export async function createComment(postId, { content, password }) {
  const payload = { content, password };
  const res = await api.post(`/posts/${postId}/comments`, payload);
  return res.data; // expecting { id, message }
}

export async function updateComment(commentId, { content, password }) {
  const payload = { password };
  if (content !== undefined) payload.content = content;
  const res = await api.put(`/comments/${commentId}`, payload);
  return res.data; // expecting { message, comment }
}

export async function deleteComment(commentId, password) {
  const res = await api.delete(`/comments/${commentId}`, { params: { password } });
  return res.data; // expecting { message }
}