<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/posts'" />

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <article
        v-else-if="post"
        class="post-card card post-detail-card content-card"
        role="article">
        <header class="post-header">
          <CategoryBadge :label="categoryLabel" v-if="categoryLabel" />
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta caption">{{ formatDate(post.created_at) }}</div>
        </header>

        <hr class="divider" />

        <section class="post-content" v-html="formattedContent" />

        <footer class="post-footer">
          <div class="post-actions">
            <button class="btn btn-ghost" @click="onEditClick" type="button">
              수정
            </button>
            <button
              class="btn btn-outline danger"
              @click="onDeleteClick"
              type="button">
              삭제
            </button>
          </div>
        </footer>
      </article>

      <!-- 댓글 섹션 분리 컴포넌트 (같은 content-card 규칙을 사용하여 정렬 일치) -->
      <CommentSection v-if="post" :post-id="id" />

      <PasswordModal
        :visible="showPwdModal"
        @close="onPwdModalClose"
        :on-confirm="onPwdConfirmForEdit" />

      <PasswordModal
        :visible="showDeleteModal"
        @close="() => (showDeleteModal = false)"
        :on-confirm="onDeleteConfirm" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import AppHeader from "../components/AppHeader.vue";
import PasswordModal from "../components/PasswordModal.vue";
import BackButton from "../components/BackButton.vue";
import CategoryBadge from "../components/CategoryBadge.vue";
import CommentSection from "../components/comments/CommentSection.vue";
import { getPost, deletePost, updatePost } from "../api/posts.js";
import { listCategories } from "../api/categories.js";
import { useRoute, useRouter } from "vue-router";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "PostDetail",
  components: { AppHeader, PasswordModal, BackButton, CategoryBadge, CommentSection },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id;
    const post = ref(null);
    const loading = ref(false);
    const error = ref("");
    const showDeleteModal = ref(false);
    const showPwdModal = ref(false);
    const categories = ref([]);

    async function loadCategories() {
      try {
        const res = await listCategories();
        categories.value = Array.isArray(res) ? res : [];
      } catch {
        categories.value = [];
      }
    }

    async function load() {
      loading.value = true;
      error.value = "";
      try {
        const res = await getPost(id);
        post.value = res || null;
        if (!post.value) error.value = "게시글을 찾을 수 없습니다.";
      } catch {
        error.value = "게시글을 불러오지 못했습니다.";
      } finally {
        loading.value = false;
      }
    }

    onMounted(async () => {
      await loadCategories();
      await load();
    });

    function formatDate(s) {
      return formatDateToKorean(s) || "";
    }

    const formattedContent = computed(() => {
      if (!post.value) return "";
      const raw = post.value.content || "";
      const safe = String(raw)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
      return safe
        .split(/\r?\n/)
        .map((p) => `<p style="margin:10px 0; line-height:1.8;">${p}</p>`)
        .join("");
    });

    const categoryLabel = computed(() => {
      if (!post.value) return null;
      if (post.value.category_name) return post.value.category_name;
      if (post.value.category && post.value.category.name) return post.value.category.name;
      if (post.value.category_id !== undefined && post.value.category_id !== null) {
        const found = categories.value.find((c) => Number(c.id) === Number(post.value.category_id));
        return found ? found.name : null;
      }
      return null;
    });

    function onEditClick() {
      showPwdModal.value = true;
    }
    function onDeleteClick() {
      showDeleteModal.value = true;
    }

    function onPwdModalClose() {
      showPwdModal.value = false;
    }

    async function onPwdConfirmForEdit(pwd) {
      try {
        await updatePost(id, { password: pwd });
        router.push({ name: "PostEdit", params: { id } });
        return;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          throw new Error("게시글을 찾을 수 없습니다.");
        }
        if (status === 403) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "비밀번호 확인 중 오류가 발생했습니다.";
        throw new Error(msg);
      }
    }

    async function onDeleteConfirm(pwd) {
      try {
        await deletePost(id, pwd);
        router.push({ name: "PostsList" });
        return;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          throw new Error("게시글을 찾을 수 없습니다.");
        }
        if (status === 403) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "삭제에 실패했습니다. 비밀번호를 확인하세요.";
        throw new Error(msg);
      }
    }

    return {
      id,
      post,
      loading,
      error,
      showDeleteModal,
      showPwdModal,
      onEditClick,
      onDeleteClick,
      onDeleteConfirm,
      onPwdConfirmForEdit,
      onPwdModalClose,
      formatDate,
      formattedContent,
      categoryLabel,
    };
  },
};
</script>

<style scoped>
/* content-card: 게시글/댓글 카드 정렬을 완전히 동일하게 유지하기 위한 공통 스타일 */
.content-card {
  max-width: 820px;
  margin: 20px auto;
  padding: 22px;
  box-sizing: border-box;
  border-radius: var(--radius-md);
}

/* Post specific */
.post-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.post-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--navy);
}
.post-meta {
  color: var(--muted);
}
.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}
.post-content {
  color: var(--text);
  font-size: 16px;
  line-height: 1.8;
}
.post-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
.post-actions {
  display: flex;
  gap: 8px;
}
.btn {
  min-width: 88px;
}

/* responsive */
@media (max-width: 768px) {
  .content-card {
    padding: 16px;
    margin: 12px 0;
  }
  .post-footer {
    justify-content: stretch;
  }
  .post-actions {
    justify-content: space-between;
    width: 100%;
  }
}
</style>