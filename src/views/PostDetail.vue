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
              @click="showDeleteModal = true"
              type="button">
              삭제
            </button>
          </div>
        </footer>
      </article>

      <PasswordModal
        :visible="showPwdModal"
        @close="onPwdModalClose"
        @confirm="onPwdConfirmForEdit" />

      <PasswordModal
        :visible="showDeleteModal"
        @close="() => (showDeleteModal = false)"
        @confirm="onDeleteConfirm" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import AppHeader from "../components/AppHeader.vue";
import PasswordModal from "../components/PasswordModal.vue";
import BackButton from "../components/BackButton.vue";
import { getPost, deletePost, verifyPostPassword } from "../api/posts.js";
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

    // --- Edit flow: open password modal, verify via backend, then navigate ---
    function onEditClick() {
      // open password modal for edit verification
      showPwdModal.value = true;
    }

    function onPwdModalClose() {
      showPwdModal.value = false;
    }

    // handler for confirm emitted by PasswordModal for EDIT action
    // PasswordModal awaits this promise and will display any thrown error message
    async function onPwdConfirmForEdit(pwd) {
      // Do not implement any client-side comparison or insecure fallback.
      // Attempt to call backend verification endpoint (verifyPostPassword).
      // If backend does not implement this endpoint, this call will fail
      // and the error will be shown inside the modal (parent throws).
      try {
        const res = await verifyPostPassword(id, pwd);
        // Expected successful response: { verified: true }
        if (res && res.verified) {
          // close modal and navigate to edit
          showPwdModal.value = false;
          router.push({ name: "PostEdit", params: { id } });
          return;
        }
        // if backend responds but not verified, throw with message
        throw new Error(res?.detail || "비밀번호가 일치하지 않습니다.");
      } catch (err) {
        // Normalize and rethrow so PasswordModal can show message
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "비밀번호 검증에 실패했습니다.";
        throw new Error(msg);
      }
    }

    // Delete flow (existing): reuse modal for delete; parent handles deletion
    async function onDeleteConfirm(pwd) {
      try {
        await deletePost(id, pwd);
        router.push({ name: "PostsList" });
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          "삭제에 실패했습니다. 비밀번호를 확인하세요.";
        throw new Error(msg);
      } finally {
        showDeleteModal.value = false;
      }
    }

    return {
      post,
      loading,
      error,
      showDeleteModal,
      showPwdModal,
      onEditClick,
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
