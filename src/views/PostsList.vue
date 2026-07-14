<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/'" />

      <div class="posts-controls">
        <input v-model="query" placeholder="게시글 검색" @input="onSearch" />
        <button @click="goNew">+ 글쓰기</button>
      </div>

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else>
        <div v-if="pagedItems.length === 0" class="state">
          게시글이 없습니다.
        </div>
        <div class="post-list">
          <article v-for="p in pagedItems" :key="p.id" class="post-row">
            <div class="left" @click="openPost(p.id)">
              <div class="title">{{ p.title }}</div>
              <div class="meta">{{ formatDate(p.created_at) }}</div>
            </div>
          </article>
        </div>

        <div class="pagination" v-if="pages > 1">
          <button :disabled="page === 1" @click="page--">&lt;</button>
          <button
            v-for="n in pages"
            :key="n"
            :class="{ active: n === page }"
            @click="page = n">
            {{ n }}
          </button>
          <button :disabled="page === pages" @click="page++">&gt;</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { listPosts } from "../api/posts.js";
import { useRouter } from "vue-router";
import BackButton from "../components/BackButton.vue";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "PostsList",
  components: { AppHeader, BackButton },
  setup() {
    const posts = ref([]);
    const loading = ref(false);
    const error = ref("");
    const query = ref("");
    const page = ref(1);
    const perPage = 7;
    const router = useRouter();

    async function load() {
      loading.value = true;
      try {
        const ps = await listPosts();
        posts.value = ps.sort((a, b) => Number(b.id) - Number(a.id));
      } catch {
        error.value = "게시글을 불러오는 데 실패했습니다.";
      } finally {
        loading.value = false;
      }
    }

    const filtered = computed(() => {
      if (!query.value) return posts.value;
      const q = query.value.toLowerCase();
      return posts.value.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q),
      );
    });

    const pages = computed(() =>
      Math.max(1, Math.ceil(filtered.value.length / perPage)),
    );
    const pagedItems = computed(() => {
      const start = (page.value - 1) * perPage;
      return filtered.value.slice(start, start + perPage);
    });

    function openPost(id) {
      router.push({ name: "PostDetail", params: { id } });
    }
    function goNew() {
      router.push({ name: "PostNew" });
    }
    function formatDate(s) {
      return formatDateToKorean(s) || "";
    }
    function onSearch() {
      page.value = 1;
    }

    watch(page, (v) => {
      if (v < 1) page.value = 1;
      if (v > pages.value) page.value = pages.value;
    });

    onMounted(load);
    return {
      posts,
      loading,
      error,
      query,
      page,
      pages,
      pagedItems,
      openPost,
      goNew,
      formatDate,
      onSearch,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 1126px;
  margin: 28px auto;
  padding: 0 20px;
}
.posts-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.posts-controls input {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.posts-controls button {
  background: #0b63d6;
  color: white;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.post-row {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: var(--shadow);
  cursor: pointer;
  display: flex;
}
.post-row .left {
  flex: 1;
  text-align: left;
}
.title {
  font-weight: 600;
  color: var(--text-h);
}
.meta {
  color: var(--text);
  font-size: 13px;
  margin-top: 6px;
}
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}
.pagination button {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
}
.pagination button.active {
  background: #0b63d6;
  color: white;
  border-color: #0b63d6;
}
.state.error {
  color: #d9534f;
}
</style>
