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
            총 <strong>{{ filteredPosts.length }}</strong>개의 글
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
    const selectedCategory = ref(""); // "" = 전체, otherwise category id

    // build filter options: 전체 + backend categories
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
        // backend doesn't support server-side category filter currently; pass params for forward-compat
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

    // Derived filtered posts: apply category + keyword client-side (because backend doesn't filter)
    const filteredPosts = computed(() => {
      const q = query.value ? String(query.value).toLowerCase() : "";
      return posts.value.filter((p) => {
        // category filter
        if (selectedCategory.value !== "" && selectedCategory.value !== null) {
          const pid = p.category_id !== undefined && p.category_id !== null ? String(p.category_id) : "";
          if (pid !== String(selectedCategory.value)) return false;
        }
        // keyword filter (title or content)
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

    function selectCategory(id) {
      selectedCategory.value = id === "" ? "" : String(id);
      page.value = 1;
      updateQueryParams();
      // Because backend doesn't filter, we only re-filter client-side (posts already loaded)
      // But if you want to re-fetch from server when server supports filter, use loadPosts()
    }

    function updateQueryParams() {
      // Build new query preserving other params as necessary
      const newQuery = { ...route.query };
      if (query.value) newQuery.keyword = query.value;
      else delete newQuery.keyword;
      if (selectedCategory.value !== "" && selectedCategory.value !== null) newQuery.category_id = String(selectedCategory.value);
      else delete newQuery.category_id;
      router.replace({ name: route.name || "PostsList", query: newQuery }).catch(() => {});
    }

    // Initialize from route query if present
    onMounted(async () => {
      await loadCategories();
      const q = route.query || {};
      if (q.keyword) query.value = String(q.keyword);
      if (q.category_id) selectedCategory.value = String(q.category_id);
      await loadPosts();
    });

    // watch posts change -> ensure page bounds
    watch(page, (v) => {
      if (v < 1) page.value = 1;
      if (v > pages.value) page.value = pages.value;
    });

    // When categories load after posts, ensure labels show
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

/* Page head: align title left, controls right and vertically center */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

/* Title block */
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

/* Actions wrapper: keeps search + write on one line by default */
.page-head-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

/* posts-actions: controls container */
.posts-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* Search input */
.search-input {
  width: 280px;
  max-width: 100%;
  height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 15px;
  box-sizing: border-box;
  min-width: 0;
}

/* Create / write button */
.create-btn {
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  white-space: nowrap;
  min-width: 92px;
  box-sizing: border-box;
}

/* category filter (unchanged) */
.category-filter-wrap {
  margin: 14px 0;
}
.category-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
}
.category-filter-btn {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.category-filter-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* posts list card */
.posts-list-card {
  padding: 0;
  overflow: hidden;
}
.posts-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* post row: keeps contents left-aligned */
.post-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(231, 235, 241, 0.9);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.08s ease;
  text-align: left;
}
.post-row:hover {
  background: var(--primary-soft);
}

/* header: badge + title + date */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
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
}
.post-date {
  flex-shrink: 0;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

/* preview: use full width and clamp to 2 lines */
.post-preview {
  width: 100%;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  text-align: left;

  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  white-space: normal;
  word-break: keep-all;
  overflow-wrap: break-word;
}

/* Responsive behavior */

/* Tablet / mobile general: stack title + actions vertically but keep actions row intact */
@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-head-right {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }

  .posts-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .search-input {
    /* allow input to grow and take remaining width */
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }

  .create-btn {
    flex: 0 0 92px;
  }
}

/* Very narrow screens: stack controls */
@media (max-width: 360px) {
  .posts-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .search-input,
  .create-btn {
    width: 100%;
    flex-basis: auto;
  }

  .create-btn {
    min-width: 0;
  }
}
</style>