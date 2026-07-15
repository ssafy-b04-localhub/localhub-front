<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/posts'" />

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <article
        v-else-if="post"
        class="post-card card post-detail-card"
        role="article">
        <header class="post-header">
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

      <!-- Edit modal: pass handler as prop (preferred) -->
      <PasswordModal
        :visible="showPwdModal"
        @close="onPwdModalClose"
        :on-confirm="onPwdConfirmForEdit" />

      <!-- Delete modal: pass handler as prop (preferred) -->
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
import { getPost, deletePost, updatePost } from "../api/posts.js";
import { useRoute, useRouter } from "vue-router";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "PostDetail",
  components: { AppHeader, PasswordModal, BackButton },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id;
    const post = ref(null);
    const loading = ref(false);
    const error = ref("");
    // modal visibility states
    const showDeleteModal = ref(false);
    const showPwdModal = ref(false);

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

    onMounted(load);

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

    // --- click handlers to open appropriate modal ---
    function onEditClick() {
      showPwdModal.value = true;
    }
    function onDeleteClick() {
      showDeleteModal.value = true;
    }

    function onPwdModalClose() {
      showPwdModal.value = false;
    }

    // Parent confirm handler for EDIT: use existing PUT /posts/{id} to validate password.
    // We send only { password } so backend checks password and performs no update when title/content absent.
    // Parent must throw Error on failure so modal displays message and stays open.
    async function onPwdConfirmForEdit(pwd) {
      try {
        // call update endpoint with only password to validate credentials
        await updatePost(id, { password: pwd });
        // success -> navigate to edit (PasswordModal will auto-close after awaited success)
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

    // Parent confirm handler for DELETE: keep existing logic (uses deletePost which expects password as query param)
    async function onDeleteConfirm(pwd) {
      try {
        await deletePost(id, pwd);
        // success -> navigate away (PasswordModal will auto-close after awaited success)
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
    };
  },
};
</script>

<style scoped>
.container {
  max-width: var(--content-width);
  padding-bottom: 40px;
}
.post-detail-card {
  max-width: 820px;
  margin: 20px auto;
  padding: 22px;
}
.post-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

/* danger outline */
.btn-outline.danger {
  border-color: var(--danger);
  color: var(--danger);
}

/* responsive */
@media (max-width: 768px) {
  .post-detail-card {
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