<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/posts'" />

      <div class="form-card">
        <h2>{{ isEdit ? "게시글 수정" : "게시글 작성" }}</h2>

        <label>제목</label>
        <input v-model="title" placeholder="제목을 입력해주세요" />

        <label>내용</label>
        <textarea
          v-model="content"
          placeholder="내용을 입력해주세요"
          rows="10"></textarea>

        <label>수정용 비밀번호</label>
        <input
          v-model="password"
          type="password"
          placeholder="비밀번호를 입력해주세요" />

        <div class="actions">
          <button @click="cancel">취소</button>
          <button class="primary" @click="submit" :disabled="submitting">
            {{ submitting ? "전송중..." : isEdit ? "수정" : "등록" }}
          </button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { createPost, getPost, updatePost } from "../api/posts.js";
import { useRoute, useRouter } from "vue-router";
import BackButton from "../components/BackButton.vue";

export default {
  name: "PostForm",
  components: { AppHeader, BackButton },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id;
    const isEdit = !!id;
    const title = ref("");
    const content = ref("");
    const password = ref("");
    const submitting = ref(false);
    const error = ref("");

    async function load() {
      if (!isEdit) return;
      try {
        const p = await getPost(id);
        if (!p) {
          error.value = "게시글을 찾을 수 없습니다.";
          return;
        }
        title.value = p.title || "";
        content.value = p.content || "";
        // Do NOT prefill password for security
      } catch {
        error.value = "게시글을 불러오지 못했습니다.";
      }
    }

    async function submit() {
      error.value = "";
      if (!title.value.trim()) {
        error.value = "제목을 입력해주세요.";
        return;
      }
      if (!content.value.trim()) {
        error.value = "내용을 입력해주세요.";
        return;
      }
      if (!password.value) {
        error.value = "비밀번호를 입력해주세요.";
        return;
      }

      submitting.value = true;
      try {
        if (isEdit) {
          await updatePost(id, {
            title: title.value,
            content: content.value,
            password: password.value,
          });
          router.push({ name: "PostDetail", params: { id } });
        } else {
          await createPost({
            title: title.value,
            content: content.value,
            password: password.value,
          });
          router.push({ name: "PostsList" });
        }
      } catch (err) {
        const msg = err?.response?.data?.detail || "요청에 실패했습니다.";
        error.value = msg;
      } finally {
        submitting.value = false;
      }
    }

    function cancel() {
      router.back();
    }

    onMounted(load);
    return {
      title,
      content,
      password,
      submit,
      cancel,
      isEdit,
      submitting,
      error,
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
.form-card {
  background: white;
  padding: 18px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
label {
  font-weight: 600;
  margin-top: 8px;
  color: var(--text-h);
}
input,
textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}
button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
}
button.primary {
  background: #0b63d6;
  color: white;
  border-color: #0b63d6;
}
.error {
  color: #d9534f;
}
</style>
