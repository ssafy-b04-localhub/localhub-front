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