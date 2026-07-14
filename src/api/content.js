import api from "./index.js";

export async function getContentTypes() {
  const res = await api.get("/api/content-types");
  return res.data;
}

export async function getPlaces({
  content_type = "",
  keyword = "",
  limit = 20,
} = {}) {
  const params = {};
  if (content_type) params.content_type = content_type;
  if (keyword) params.keyword = keyword;
  if (limit) params.limit = limit;
  const res = await api.get("/api/places", { params });
  return res.data; // { items, count, total }
}

export async function getPlace(contentid) {
  const res = await api.get(`/api/places/${contentid}`);
  return res.data; // { item: { ... } }
}
