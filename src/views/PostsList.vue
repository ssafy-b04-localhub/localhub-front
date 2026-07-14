<template>
  <div>
    <AppHeader />
    <main class="container page posts-page">
      <BackButton :fallback="'/'" />

      <section class="page-head">
        <div class="page-head-left">
          <h1 class="h-page">커뮤니티</h1>
          <p class="caption page-desc">
            부산의 장소와 행사에 대한 이야기를 자유롭게 공유해 보세요.
          </p>
          <div class="post-count caption">
            총 <strong>{{ posts.length }}</strong
            >개의 글
          </div>
        </div>

        <div class="page-head-right">
          <div class="posts-actions">
            <input
              v-model="query"
              class="search-input"
              placeholder="게시글 검색"
              @input="onSearch"
              aria-label="게시글 검색" />
            <button class="btn create-btn" @click="goNew" type="button">
              + 글쓰기
            </button>
          </div>
        </div>
      </section>

      <section class="card posts-list-card" aria-live="polite">
        <div v-if="loading" class="state">로딩 중...</div>
        <div v-else-if="error" class="state error">{{ error }}</div>

        <div v-else>
          <div v-if="pagedItems.length === 0" class="empty-state">
            <div class="empty-emoji">💬</div>
            <div class="empty-text">
              아직 게시글이 없습니다. 먼저 이야기를 시작해보세요.
            </div>
          </div>

          <div v-else class="posts-body">
            <article
              v-for="p in pagedItems"
              :key="p.id"
              class="post-row"
              @click="openPost(p.id)"
              role="button"
              tabindex="0"
              @keyup.enter="openPost(p.id)">
              <div class="post-row-left">
                <div class="title">{{ p.title }}</div>
                <div class="excerpt caption">{{ excerpt(p.content) }}</div>
              </div>

              <div class="post-row-right">
                <div class="meta">{{ formatDate(p.created_at) }}</div>
              </div>
            </article>
          </div>

          <div
            class="pagination"
            v-if="pages > 1"
            role="navigation"
            aria-label="페이지네이션">
            <button
              class="page-btn"
              :disabled="page === 1"
              @click="page = page - 1">
              &lt;
            </button>

            <button
              v-for="n in pages"
              :key="n"
              class="page-btn"
              :class="{ active: n === page }"
              @click="page = n"
              :aria-current="n === page ? 'page' : null">
              {{ n }}
            </button>

            <button
              class="page-btn"
              :disabled="page === pages"
              @click="page = page + 1">
              &gt;
            </button>
          </div>
        </div>
      </section>
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
      error.value = "";
      try {
        const ps = await listPosts();
        posts.value = Array.isArray(ps)
          ? ps.sort((a, b) => Number(b.id) - Number(a.id))
          : [];
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
    function excerpt(text) {
      if (!text) return "";
      const t = String(text).replace(/\s+/g, " ").trim();
      return t.length > 80 ? t.slice(0, 80) + "…" : t;
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
      excerpt,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: var(--content-width);
  margin-top: 20px;
  padding-bottom: 40px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}
.page-head-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.page-desc {
  margin: 0;
  color: var(--muted);
  margin-top: 8px;
}
.posts-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* unified heights for search input and create button */
.search-input {
  min-width: 260px;
  height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 15px;
  box-sizing: border-box;
}
.create-btn {
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* card list */
.posts-list-card {
  padding: 0;
  overflow: hidden;
}
.posts-body {
  display: flex;
  flex-direction: column;
}
.post-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(231, 235, 241, 0.9);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.08s ease;
}
.post-row:hover {
  background: var(--primary-soft);
}
.post-row-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.title {
  font-weight: 600;
  color: var(--navy);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.excerpt {
  color: var(--muted);
  font-size: 13px;
  max-width: 60ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.post-row-right {
  min-width: 110px;
  text-align: right;
}
.meta {
  color: var(--muted);
  font-size: 13px;
}

/* empty state */
.empty-state {
  padding: 40px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}
.empty-emoji {
  font-size: 26px;
}
.empty-text {
  color: var(--muted);
}

/* pagination */
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 12px;
}
.page-btn {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
}
.page-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* responsive */
@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .posts-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .search-input {
    width: 100%;
    min-width: 0;
  }
  .create-btn {
    width: 100%;
  }
  .post-row {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .post-row-right {
    align-self: flex-end;
    text-align: right;
  }
}
</style>
