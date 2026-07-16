<template>
  <div>
    <AppHeader />
    <main class="container page posts-page">
      <!-- 1. 뒤로가기 -->
      <BackButton :fallback="'/'" />

      <!-- 2. 제목 / 3. 설명 / 4. 게시글 수 -->
      <section class="page-head">
        <h1 class="h-page">커뮤니티</h1>
        <p class="caption page-desc">
          부산의 장소와 행사에 대한 이야기를 자유롭게 공유해 보세요.
        </p>
        <div class="post-count caption">
          총 <strong>{{ filteredPosts.length }}</strong>개의 글
        </div>
      </section>

      <!-- 5. 카테고리 -->
      <section class="category-filter-wrap">
        <div class="category-filter" role="toolbar" aria-label="카테고리 필터">
          <button
            v-for="opt in filterOptions"
            :key="opt.key"
            type="button"
            class="category-filter-btn"
            :class="{ active: String(selectedCategory) === String(opt.id) }"
            @click="selectCategory(opt.id)"
            :aria-pressed="String(selectedCategory) === String(opt.id)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div v-if="categoriesError" class="caption error small">{{ categoriesError }}</div>
      </section>

      <!-- 6. 검색 입력창 -->
      <!-- 7. 글쓰기 버튼 (검색창 아래) -->
      <section class="search-and-create">
        <input
          v-model="query"
          class="search-input"
          placeholder="게시글 검색"
          @input="onSearch"
          aria-label="게시글 검색" />
        <button class="btn create-btn" @click="goNew" type="button">
          + 글쓰기
        </button>
      </section>

      <!-- 8. 게시글 목록 -->
      <section class="card posts-list-card" aria-live="polite">
        <div v-if="loading" class="state">로딩 중...</div>
        <div v-else-if="error" class="state error">{{ error }}</div>

        <div v-else>
          <div v-if="filteredPosts.length === 0" class="empty-state">
            <div class="empty-emoji">💬</div>
            <div class="empty-text">
              해당 조건에 맞는 게시글이 없습니다.
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
              <div class="post-header">
                <div class="post-title-group">
                  <CategoryBadge
                    v-if="getCategoryLabel(p)"
                    :label="getCategoryLabel(p)"
                  />
                  <h3 class="post-title">{{ p.title }}</h3>

                  <!-- 댓글 개수 표시: backend는 `comment_count`를 반환합니다.
                       존재하지 않거나 null/undefined이면 0으로 표시합니다. -->
                  <span
                    class="comment-count"
                    :aria-label="`댓글 ${getCommentCount(p)}개`"
                    aria-hidden="false"
                  >
                    <span class="comment-icon" aria-hidden="true">💬</span>
                    <span class="comment-num">{{ getCommentCount(p) }}</span>
                  </span>
                </div>

                <time class="post-date">{{ formatDate(p.created_at) }}</time>
              </div>

              <p class="post-preview">{{ excerpt(p.content) }}</p>
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
import CategoryBadge from "../components/CategoryBadge.vue";
import { listPosts } from "../api/posts.js";
import { listCategories } from "../api/categories.js";
import { useRouter, useRoute } from "vue-router";
import BackButton from "../components/BackButton.vue";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "PostsList",
  components: { AppHeader, BackButton, CategoryBadge },
  setup() {
    const posts = ref([]);
    const loading = ref(false);
    const error = ref("");
    const query = ref("");
    const page = ref(1);
    const perPage = 7;
    const router = useRouter();
    const route = useRoute();

    // categories
    const categories = ref([]);
    const categoriesError = ref("");
    const categoriesLoading = ref(false);
    const selectedCategory = ref("");

    const filterOptions = computed(() => {
      const opts = [{ key: "all", id: "", label: "전체" }];
      for (const c of categories.value) {
        opts.push({ key: `c${c.id}`, id: String(c.id), label: c.name });
      }
      return opts;
    });

    async function loadCategories() {
      categoriesLoading.value = true;
      categoriesError.value = "";
      try {
        const res = await listCategories();
        categories.value = Array.isArray(res) ? res : [];
      } catch {
        categories.value = [];
        categoriesError.value = "카테고리 목록을 불러오지 못했습니다.";
      } finally {
        categoriesLoading.value = false;
      }
    }

    async function loadPosts() {
      loading.value = true;
      error.value = "";
      try {
        const res = await listPosts({ category_id: selectedCategory.value || undefined, keyword: query.value || undefined });
        posts.value = Array.isArray(res)
          ? res.sort((a, b) => Number(b.id) - Number(a.id))
          : [];
      } catch {
        posts.value = [];
        error.value = "게시글을 불러오는 데 실패했습니다.";
      } finally {
        loading.value = false;
      }
    }

    const filteredPosts = computed(() => {
      const q = query.value ? String(query.value).toLowerCase() : "";
      return posts.value.filter((p) => {
        if (selectedCategory.value !== "" && selectedCategory.value !== null) {
          const pid = p.category_id !== undefined && p.category_id !== null ? String(p.category_id) : "";
          if (pid !== String(selectedCategory.value)) return false;
        }
        if (q) {
          const hay1 = (p.title || "").toString().toLowerCase();
          const hay2 = (p.content || "").toString().toLowerCase();
          return hay1.includes(q) || hay2.includes(q);
        }
        return true;
      });
    });

    const pages = computed(() =>
      Math.max(1, Math.ceil(filteredPosts.value.length / perPage)),
    );
    const pagedItems = computed(() => {
      const start = (page.value - 1) * perPage;
      return filteredPosts.value.slice(start, start + perPage);
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
      updateQueryParams();
    }
    function excerpt(text) {
      if (!text) return "";
      const t = String(text).replace(/\s+/g, " ").trim();
      return t.length > 200 ? t.slice(0, 200) + "…" : t;
    }

    function getCategoryLabel(p) {
      if (!p) return null;
      if (p.category_name) return p.category_name;
      if (p.category && p.category.name) return p.category.name;
      if (p.category_id !== undefined && p.category_id !== null) {
        const f = categories.value.find((c) => Number(c.id) === Number(p.category_id));
        return f ? f.name : null;
      }
      return null;
    }

    // 댓글 개수 취득: backend 응답은 `comment_count`로 제공됩니다.
    // 다른 네이밍(예: commentCount, comments_count 등)이 올 수 있으므로 모두 커버.
    function getCommentCount(p) {
      if (!p) return 0;
      const raw = p.comment_count ?? p.comments_count ?? p.commentsCount ?? p.commentCount ?? 0;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }

    function selectCategory(id) {
      selectedCategory.value = id === "" ? "" : String(id);
      page.value = 1;
      updateQueryParams();
    }

    function updateQueryParams() {
      const newQuery = { ...route.query };
      if (query.value) newQuery.keyword = query.value;
      else delete newQuery.keyword;
      if (selectedCategory.value !== "" && selectedCategory.value !== null) newQuery.category_id = String(selectedCategory.value);
      else delete newQuery.category_id;
      router.replace({ name: route.name || "PostsList", query: newQuery }).catch(() => {});
    }

    onMounted(async () => {
      await loadCategories();
      const q = route.query || {};
      if (q.keyword) query.value = String(q.keyword);
      if (q.category_id) selectedCategory.value = String(q.category_id);
      await loadPosts();
    });

    watch(page, (v) => {
      if (v < 1) page.value = 1;
      if (v > pages.value) page.value = pages.value;
    });

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
      getCategoryLabel,
      categoriesError,
      filterOptions,
      selectedCategory,
      selectCategory,
      filteredPosts,
      getCommentCount,
    };
  },
};
</script>

<style scoped>
/* 컨테이너: Places.vue와 동일한 모바일 패딩 적용 */
.container {
  max-width: var(--content-width);
  margin: 28px auto;
  padding: 0 16px;
}

/* 제목/설명/카운트 블록 */
.page-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.h-page {
  margin: 0;
}
.page-desc {
  margin: 0;
  color: var(--muted);
}
.post-count {
  color: var(--muted);
}

/* 카테고리 필터: 장소 목록 스타일과 유사하게 wrap 처리, 가로 스크롤 방지 */
.category-filter-wrap {
  margin: 14px 0;
}
.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  padding-bottom: 0;
  -webkit-overflow-scrolling: touch;
  overflow: visible;
}

/* category btn */
.category-filter-btn {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-weight: 600;
  cursor: pointer;
}
.category-filter-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* 검색 + 글쓰기: 모바일 전용 스택, 검색 위 카테고리 */
.search-and-create {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px; /* 글쓰기 버튼과 목록 사이 여백 20~24px 권장 */
}

/* 검색창 및 버튼 전체 너비 */
.search-input {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 15px;
  box-sizing: border-box;
}

/* 글쓰기 버튼 전체 너비 */
.create-btn {
  width: 100%;
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

/* posts list card */
.posts-list-card {
  padding: 0;
  overflow: hidden;
}

/* 게시글 목록 항목 스타일(기존 유지) */
.posts-body {
  display: flex;
  flex-direction: column;
}

/* ensure left alignment for titles, previews and meta */
.post-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(231, 235, 241, 0.9);
  cursor: pointer;
  text-align: left; /* 강제 왼쪽 정렬 */
}
.post-row:hover {
  background: var(--primary-soft);
}

/* Header: badge + title + date */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
  text-align: left;
}
.post-title-group {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
}
.post-title-group .category-badge {
  flex: 0 0 auto;
  width: auto;
}
.post-title {
  min-width: 0;
  margin: 0;
  font-weight: 600;
  color: var(--navy);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left; /* 제목 왼쪽 정렬 */
}

/* 댓글 개수 배지: 제목 옆에 자연스럽게 위치, 줄넘김 없이 유지 */
.comment-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  color: var(--muted);
  font-size: 13px;
  flex-shrink: 0;
  white-space: nowrap;
}
.comment-count .comment-icon {
  font-size: 14px;
  line-height: 1;
}
.comment-count .comment-num {
  font-weight: 600;
  color: var(--muted);
}

/* 날짜는 우측 고정 */
.post-date {
  flex-shrink: 0;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
  text-align: right;
}

/* Preview: up to 2 lines */
.post-preview {
  width: 100%;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  text-align: left; /* 미리보기 왼쪽 정렬 */

  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  white-space: normal;
  word-break: keep-all;
  overflow-wrap: break-word;
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

/* responsive adjustments */
@media (max-width: 768px) {
  .page-head {
    gap: 6px;
  }
  .search-and-create {
    gap: 10px; /* 검색 & 글쓰기 사이 10~12px 권장 */
  }

  .post-row {
    padding: 12px;
  }

  .post-header {
    align-items: flex-start;
    gap: 8px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-date {
    align-self: flex-end;
  }

  /* 모바일에서 댓글 배지가 너무 크지 않도록 축소 */
  .comment-count {
    font-size: 12px;
    gap: 4px;
    margin-left: 4px;
  }
}
</style>