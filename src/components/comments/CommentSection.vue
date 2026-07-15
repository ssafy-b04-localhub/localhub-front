<template>
  <section class="comment-card card content-card">
    <header class="comment-header">
      <div class="title-group">
        <h3 class="card-title">댓글</h3>
        <div class="count caption">({{ count }})</div>
      </div>
    </header>

    <div class="comment-create">
      <textarea
        v-model="content"
        placeholder="댓글을 입력해주세요."
        rows="4"
        :disabled="creating"
      ></textarea>

      <div class="form-row">
        <input
          class="pwd-input"
          type="password"
          v-model="password"
          placeholder="비밀번호 (댓글 작성시 필요)"
          :disabled="creating"
        />
        <button
          class="btn btn-primary create-btn"
          @click="onCreate"
          :disabled="creating || !canSubmit"
          type="button"
        >
          {{ creating ? "등록 중..." : "등록" }}
        </button>
      </div>

      <div v-if="createError" class="caption error">{{ createError }}</div>
    </div>


    <div class="comment-list">
      <div v-if="loading" class="state">댓글 불러오는 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else>
        <div v-if="comments.length === 0" class="caption muted">아직 작성된 댓글이 없습니다.</div>
        <ul class="list">
          <li v-for="c in comments" :key="c.id" class="list-item">
            <CommentItem
              :comment="c"
              @updated="onChildUpdated"
              @deleted="onChildUpdated"
            />
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import { ref, watch, onMounted, computed } from "vue";
import CommentItem from "./CommentItem.vue";
import { listComments, createComment } from "../../api/posts.js";

export default {
  name: "CommentSection",
  components: { CommentItem },
  props: {
    postId: {
      type: [String, Number],
      required: true,
    },
  },
  setup(props) {
    const comments = ref([]);
    const loading = ref(false);
    const error = ref("");
    const creating = ref(false);
    const createError = ref("");
    const content = ref("");
    const password = ref("");

    async function loadComments() {
      loading.value = true;
      error.value = "";
      try {
        const res = await listComments(props.postId);
        comments.value = Array.isArray(res) ? res : [];
      } catch (e) {
        error.value = "댓글을 불러오지 못했습니다.";
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      loadComments();
    });

    watch(() => props.postId, () => {
      loadComments();
    });

    const canSubmit = computed(() => {
      return content.value && content.value.trim() && password.value && password.value.trim();
    });

    async function onCreate() {
      createError.value = "";
      if (!canSubmit.value) {
        createError.value = "댓글과 비밀번호를 입력하세요.";
        return;
      }
      creating.value = true;
      try {
        await createComment(props.postId, {
          content: content.value.trim(),
          password: password.value,
        });
        content.value = "";
        password.value = "";
        await loadComments();
      } catch (err) {
        createError.value = err?.response?.data?.detail || err?.message || "댓글 작성에 실패했습니다.";
      } finally {
        creating.value = false;
      }
    }

    function onChildUpdated() {
      // 자식(수정/삭제) 완료 시 목록 갱신
      loadComments();
    }

    const count = computed(() => comments.value.length);

    return {
      comments,
      loading,
      error,
      creating,
      createError,
      content,
      password,
      onCreate,
      onChildUpdated,
      count,
      canSubmit,
    };
  },
};
</script>

<style scoped>
/* content-card: 게시글 카드와 동일한 너비/패딩/정렬을 위해 클래스 상속 */
.comment-card {
  /* content-card가 동일 규칙을 제공하므로 추가 조정은 최소화 */
}

/* 헤더 */
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.title-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.card-title {
  font-size: 20px;
  margin: 0;
}
.count {
  color: var(--muted);
  font-size: 14px;
}

/* 작성 폼 */
.comment-create textarea {
  width: 100%;
  min-height: 96px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  resize: vertical;
  box-sizing: border-box;
  font-size: 15px;
  margin-bottom: 12px;
}

/* form-row: 데스크탑은 inline, 모바일은 stacked */
.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

/* 비밀번호 입력: 데스크탑에서 버튼과 균형 맞추기 (너무 넓지 않게 제한) */
.pwd-input {
  flex: 1 1 auto;
  min-width: 0;
  max-width: calc(100% - 128px);
  height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-sizing: border-box;
  font-size: 15px;
}

/* 등록 버튼 고정 크기 */
.create-btn {
  height: 44px;
  min-width: 112px;
  padding: 0 18px;
  white-space: nowrap;
  flex: 0 0 auto;
}

/* 포커스 스타일 통일 (검은 선 제거) */
.pwd-input:focus,
.comment-create textarea:focus,
.form-row input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
}

/* list */
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.list-item {
  padding: 0;
  margin: 0;
}

/* states */
.state {
  color: var(--muted);
}
.error {
  color: var(--danger);
}

/* responsive: 모바일에서 입력창 수직 정렬, 버튼 전체폭 */
@media (max-width: 768px) {
  .content-card {
    padding: 16px;
    margin: 12px 0;
  }
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  .pwd-input {
    max-width: 100%;
  }
  .create-btn {
    width: 100%;
  }
}
</style>