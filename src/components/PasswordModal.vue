<template>
  <div v-if="visible" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h3>비밀번호 확인</h3>
      <input
        v-model="pwd"
        type="password"
        placeholder="수정/삭제 비밀번호를 입력하세요"
        @keyup.enter="confirm" />
      <div class="buttons">
        <button class="btn secondary" @click="close">취소</button>
        <button class="btn primary" :disabled="loading" @click="confirm">
          {{ loading ? "확인 중..." : "확인" }}
        </button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
export default {
  name: "PasswordModal",
  props: {
    visible: { type: Boolean, required: true },
  },
  emits: ["close", "confirm"],
  setup(_, { emit }) {
    const pwd = ref("");
    const loading = ref(false);
    const error = ref("");

    watch(
      () => _.visible,
      (v) => {
        if (v) {
          pwd.value = "";
          error.value = "";
        }
      },
    );

    function close() {
      emit("close");
      pwd.value = "";
      error.value = "";
    }

    async function confirm() {
      if (!pwd.value) {
        error.value = "비밀번호를 입력해주세요.";
        return;
      }
      loading.value = true;
      try {
        await emit("confirm", pwd.value);
      } finally {
        loading.value = false;
      }
    }

    return { pwd, loading, error, close, confirm };
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 14, 18, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
}
.modal {
  width: 420px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow);
  text-align: left;
}
.modal h3 {
  margin: 0 0 12px;
  color: var(--text-h);
}
.modal input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 12px;
}
.buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn.secondary {
  background: white;
  border: 1px solid var(--border);
}
.btn.primary {
  background: #0b63d6;
  color: white;
  border-color: #0b63d6;
}
.error {
  color: #d9534f;
  margin-top: 8px;
  font-size: 13px;
}
</style>
