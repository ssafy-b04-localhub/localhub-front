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
