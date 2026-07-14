<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/posts'" />

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="post" class="post-card">
        <h1>{{ post.title }}</h1>
        <div class="meta">{{ formatDate(post.created_at) }}</div>
        <div class="content" v-html="formattedContent"></div>

        <div class="actions">
          <button @click="goEdit">수정</button>
          <button class="danger" @click="showDeleteModal = true">삭제</button>
        </div>
      </div>
      <PasswordModal
        :visible="showDeleteModal"
        @close="showDeleteModal = false"
        @confirm="onDeleteConfirm" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import AppHeader from "../components/AppHeader.vue";
import PasswordModal from "../components/PasswordModal.vue";
import BackButton from "../components/BackButton.vue";
import { getPost, deletePost } from "../api/posts.js";
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

    async function load() {
      loading.value = true;
      try {
        post.value = await getPost(id);
        if (!post.value) error.value = "게시글을 찾을 수 없습니다.";
      } catch {
        error.value = "게시글을 불러오지 못했습니다.";
      } finally {
        loading.value = false;
      }
    }

    onMounted(load);

    function goEdit() {
      router.push({ name: "PostEdit", params: { id } });
    }

    async function onDeleteConfirm(pwd) {
      try {
        await deletePost(id, pwd);
        router.push({ name: "PostsList" });
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          "삭제에 실패했습니다. 비밀번호를 확인하세요.";
        alert(msg);
      } finally {
        showDeleteModal.value = false;
      }
    }

    function formatDate(s) {
      return formatDateToKorean(s) || "";
    }

    const formattedContent = computed(() => {
      if (!post.value) return "";
      return (post.value.content || "")
        .split("\n")
        .map((p) => `<p>${p}</p>`)
        .join("");
    });

    return {
      post,
      loading,
      error,
      showDeleteModal,
      goEdit,
      onDeleteConfirm,
      formatDate,
      formattedContent,
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
.post-card {
  background: white;
  padding: 18px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  text-align: left;
}
.meta {
  color: var(--text);
  margin-bottom: 12px;
}
.content p {
  line-height: 1.7;
  margin: 8px 0;
  color: var(--text);
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}
button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
}
button.danger {
  border-color: #e06a6a;
  color: #e06a6a;
}
.state.error {
  color: #d9534f;
}
</style>
