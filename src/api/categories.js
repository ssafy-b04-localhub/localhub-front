import api from "./index.js";

export async function listCategories() {
  const res = await api.get("/categories");
  return res.data; // expected: array of { id, name }
}