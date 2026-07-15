<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/posts'" />

      <section class="form-wrap">
        <article class="card form-card">
          <header class="form-header">
            <h1 class="h-page">{{ isEdit ? "게시글 수정" : "게시글 작성" }}</h1>
            <p class="caption form-desc">
              부산의 장소와 행사에 대한 이야기를 자유롭게 나눠보세요.
            </p>
          </header>

          <div class="form-body">
            <label class="field-label" for="category">카테고리</label>
            <select
              id="category"
              v-model.number="categoryId"
              :disabled="categoriesLoading"
            >
              <option value="">카테고리를 선택하지 않음</option>
              <option
                v-for="c in categories"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
            </select>
            <div v-if="categoriesError" class="caption error">{{ categoriesError }}</div>

            <label class="field-label" for="title">제목</label>
            <input
              id="title"
              v-model="title"
              placeholder="제목을 입력해주세요" />

            <label class="field-label" for="content">내용</label>
            <textarea
              id="content"
              v-model="content"
              placeholder="내용을 입력해주세요" />

            <label class="field-label" for="password">수정용 비밀번호</label>
            <input
              id="password"
              type="password"
              v-model="password"
              placeholder="비밀번호를 입력해주세요" />
            <div v-if="passwordHelp" class="caption help-text">
              {{ passwordHelp }}
            </div>

            <div v-if="error" class="error">{{ error }}</div>

            <div class="form-actions">
              <button class="btn btn-ghost" @click="cancel" type="button">
                취소
              </button>
              <button
                class="btn btn-primary"
                @click="submit"
                :disabled="submitting"
                type="button">
                {{ submitting ? "전송중..." : isEdit ? "수정" : "등록" }}
              </button>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { createPost, getPost, updatePost } from "../api/posts.js";
import { listCategories } from "../api/categories.js";
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
    const passwordHelp = ref(
      "수정 시 비밀번호를 입력해야 변경/삭제가 가능합니다.",
    );

    // categories
    const categories = ref([]);
    const categoriesLoading = ref(false);
    const categoriesError = ref("");
    const categoryId = ref(""); // '' means none

    async function loadCategories() {
      categoriesLoading.value = true;
      categoriesError.value = "";
      try {
        const res = await listCategories();
        categories.value = Array.isArray(res) ? res : [];
      } catch {
        categoriesError.value = "카테고리 목록을 불러오지 못했습니다.";
      } finally {
        categoriesLoading.value = false;
      }
    }

    async function load() {
      error.value = "";
      if (!isEdit) return;
      try {
        const p = await getPost(id);
        if (!p) {
          error.value = "게시글을 찾을 수 없습니다.";
          return;
        }
        title.value = p.title || "";
        content.value = p.content || "";
        if (p.category_id !== undefined && p.category_id !== null) {
          categoryId.value = Number(p.category_id);
        } else if (p.category && p.category.id !== undefined) {
          categoryId.value = Number(p.category.id);
        } else {
          categoryId.value = "";
        }
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
        const payload = {
          title: title.value,
          content: content.value,
          password: password.value,
          category_id: categoryId.value === "" ? null : Number(categoryId.value),
        };

        if (isEdit) {
          await updatePost(id, payload);
          router.push({ name: "PostDetail", params: { id } });
        } else {
          await createPost(payload);
          router.replace({ name: "PostsList" });
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

    onMounted(async () => {
      await loadCategories();
      await load();
    });

    return {
      title,
      content,
      password,
      submit,
      cancel,
      isEdit,
      submitting,
      error,
      passwordHelp,
      categories,
      categoriesLoading,
      categoriesError,
      categoryId,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: var(--content-width);
  padding-bottom: 40px;
}
.form-wrap {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.form-card {
  width: 100%;
  max-width: 900px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-header {
  margin-bottom: 6px;
}
.form-desc {
  margin: 6px 0 0;
  color: var(--muted);
}
.field-label {
  display: block;
  margin-top: 8px;
  font-weight: 600;
  color: var(--navy);
}
input,
textarea,
select {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 15px;
  box-sizing: border-box;
}
textarea {
  min-height: 240px;
  resize: vertical;
}
.help-text {
  margin-top: 6px;
  color: var(--muted);
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}
.error {
  color: var(--danger);
  margin-top: 6px;
}

/* responsive */
@media (max-width: 768px) {
  .form-card {
    padding: 16px;
  }
  .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .form-actions .btn {
    width: 100%;
  }
}
</style>