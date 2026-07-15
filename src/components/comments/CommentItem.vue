<template>
  <div class="comment-item">
    <div v-if="!editing" class="view-mode">
      <div class="content" v-html="formattedContent"></div>
      <div class="meta-row">
        <div class="meta-left caption">{{ formattedDate }}</div>
        <div class="meta-actions">
          <button class="btn btn-ghost btn-sm" @click="startEdit" type="button">수정</button>
          <button class="btn btn-ghost btn-sm" @click="startDelete" type="button">삭제</button>
        </div>
      </div>
    </div>

    <!-- 편집 모드 -->
    <div v-else class="edit-mode">
      <textarea v-model="editContent" rows="3"></textarea>
      <input class="small-pwd" type="password" v-model="editPassword" placeholder="비밀번호" />
      <div class="action-row">
        <button class="btn btn-primary btn-sm" @click="confirmEdit" :disabled="processing">
          {{ processing ? "저장중..." : "저장" }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="cancelEdit" :disabled="processing">취소</button>
        <div v-if="error" class="caption error">{{ error }}</div>
      </div>
    </div>

    <!-- 삭제 패널 -->
    <div v-if="deleting" class="delete-panel">
      <input class="small-pwd" type="password" v-model="deletePassword" placeholder="비밀번호" />
      <div class="action-row">
        <button class="btn btn-outline danger btn-sm" @click="confirmDelete" :disabled="processing">
          {{ processing ? "삭제중..." : "삭제 확인" }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="cancelDelete" :disabled="processing">취소</button>
        <div v-if="error" class="caption error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { updateComment, deleteComment } from "../../api/posts.js";
import formatDateToKorean from "../../utils/formatDate.js";

export default {
  name: "CommentItem",
  props: {
    comment: {
      type: Object,
      required: true,
    },
  },
  emits: ["updated", "deleted"],
  setup(props, { emit }) {
    const editing = ref(false);
    const deleting = ref(false);
    const processing = ref(false);
    const error = ref("");
    const editContent = ref(props.comment.content || "");
    const editPassword = ref("");
    const deletePassword = ref("");

    function startEdit() {
      editing.value = true;
      deleting.value = false;
      editContent.value = props.comment.content || "";
      editPassword.value = "";
      error.value = "";
    }
    function cancelEdit() {
      editing.value = false;
      editPassword.value = "";
      editContent.value = props.comment.content || "";
      error.value = "";
    }

    async function confirmEdit() {
      error.value = "";
      if (!editContent.value || !editContent.value.trim()) {
        error.value = "수정할 내용을 입력하세요.";
        return;
      }
      if (!editPassword.value || !editPassword.value.trim()) {
        error.value = "비밀번호를 입력하세요.";
        return;
      }
      processing.value = true;
      try {
        await updateComment(props.comment.id, {
          content: editContent.value.trim(),
          password: editPassword.value,
        });
        editing.value = false;
        editPassword.value = "";
        emit("updated");
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
          error.value = "비밀번호가 일치하지 않습니다.";
        } else if (status === 404) {
          error.value = "댓글이 없습니다.";
        } else {
          error.value = err?.response?.data?.detail || err?.message || "수정에 실패했습니다.";
        }
      } finally {
        processing.value = false;
      }
    }

    function startDelete() {
      deleting.value = true;
      editing.value = false;
      deletePassword.value = "";
      error.value = "";
    }
    function cancelDelete() {
      deleting.value = false;
      deletePassword.value = "";
      error.value = "";
    }

    async function confirmDelete() {
      error.value = "";
      if (!deletePassword.value || !deletePassword.value.trim()) {
        error.value = "비밀번호를 입력하세요.";
        return;
      }
      processing.value = true;
      try {
        await deleteComment(props.comment.id, deletePassword.value);
        deleting.value = false;
        deletePassword.value = "";
        emit("deleted");
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
          error.value = "비밀번호가 일치하지 않습니다.";
        } else if (status === 404) {
          error.value = "댓글이 없습니다.";
        } else {
          error.value = err?.response?.data?.detail || err?.message || "삭제에 실패했습니다.";
        }
      } finally {
        processing.value = false;
      }
    }

    const formattedContent = computed(() => {
      const raw = props.comment.content || "";
      const safe = String(raw)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
      return safe
        .split(/\r?\n/)
        .map((p) => `<p style="margin:6px 0; line-height:1.6;">${p}</p>`)
        .join("");
    });

    const formattedDate = computed(() => {
      return formatDateToKorean(props.comment.created_at) || "";
    });

    return {
      editing,
      deleting,
      processing,
      error,
      editContent,
      editPassword,
      deletePassword,
      startEdit,
      cancelEdit,
      confirmEdit,
      startDelete,
      cancelDelete,
      confirmDelete,
      formattedContent,
      formattedDate,
    };
  },
};
</script>

<style scoped>
.comment-item {
  padding: 12px 0;
  border-radius: 6px;
  background: transparent;
  border: none;
  box-sizing: border-box;
  display: block;
  border-bottom: 1px solid rgba(231,235,241,0.9);
}
.comment-item:last-child {
  border-bottom: none;
}
.view-mode .content {
  color: var(--text);
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 8px;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.meta-left {
  color: var(--muted);
}
.meta-actions {
  display: flex;
  gap: 8px;
}
.edit-mode textarea {
  width: 100%;
  min-height: 72px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  box-sizing: border-box;
  margin-bottom: 8px;
}
.small-pwd {
  width: 100%;
  max-width: 360px;
  height: 40px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  box-sizing: border-box;
  margin-bottom: 8px;
}
.small-pwd:focus,
.edit-mode textarea:focus,
.delete-panel input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.06);
}
.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-sm {
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
}
.delete-panel {
  margin-top: 8px;
}

/* responsive */
@media (max-width: 480px) {
  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .meta-actions {
    align-self: flex-end;
  }
}
</style>