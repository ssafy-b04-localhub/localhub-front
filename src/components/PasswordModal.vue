<template>
  <div
    v-if="visible"
    class="modal-backdrop"
    @click.self="close"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pwd-title">
    <div class="modal" ref="modalEl">
      <h3 id="pwd-title">비밀번호 확인</h3>
      <div class="modal-body">
        <label class="sr-only" for="pwd-input">비밀번호</label>
        <input
          id="pwd-input"
          ref="inputEl"
          v-model="pwd"
          :type="show ? 'text' : 'password'"
          placeholder="수정/삭제 비밀번호를 입력하세요"
          @keyup.enter="confirm"
          :disabled="loading" />
        <button
          type="button"
          class="toggle-visibility"
          @click="toggleShow"
          :aria-pressed="show"
          :title="show ? '숨기기' : '표시'">
          {{ show ? "숨기기" : "표시" }}
        </button>
      </div>

      <div class="buttons">
        <button class="btn btn-ghost" @click="close" type="button">취소</button>
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="confirm"
          type="button">
          {{ loading ? "확인 중..." : "확인" }}
        </button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

export default {
  name: "PasswordModal",
  props: {
    visible: { type: Boolean, required: true },
  },
  emits: ["close", "confirm"],
  setup(props, { emit }) {
    const pwd = ref("");
    const loading = ref(false);
    const error = ref("");
    const inputEl = ref(null);
    const modalEl = ref(null);
    const show = ref(false);

    watch(
      () => props.visible,
      async (v) => {
        if (v) {
          pwd.value = "";
          error.value = "";
          loading.value = false;
          show.value = false;
          await nextTick();
          // focus input when modal opens
          if (inputEl.value) inputEl.value.focus();
        }
      },
    );

    function close() {
      // reset local state
      pwd.value = "";
      error.value = "";
      loading.value = false;
      show.value = false;
      emit("close");
    }

    function toggleShow() {
      show.value = !show.value;
      // restore focus to input
      if (inputEl.value) inputEl.value.focus();
    }

    async function confirm() {
      if (!pwd.value) {
        error.value = "비밀번호를 입력해주세요.";
        return;
      }
      loading.value = true;
      error.value = "";
      try {
        // parent handler may validate and throw on failure.
        // await the parent's result so modal can show loading state.
        await emit("confirm", pwd.value);
        // on success the parent may navigate; modal should close.
        close();
      } catch (err) {
        // normalize error message
        const msg =
          (err &&
            (err.message ||
              err?.response?.data?.detail ||
              err?.response?.data)) ||
          "비밀번호 검증에 실패했습니다.";
        error.value = String(msg);
      } finally {
        loading.value = false;
      }
    }

    // ESC to close
    function onKeydown(e) {
      if (e.key === "Escape" && props.visible) {
        close();
      }
    }

    onMounted(() => {
      window.addEventListener("keydown", onKeydown);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("keydown", onKeydown);
    });

    return {
      pwd,
      loading,
      error,
      close,
      confirm,
      inputEl,
      show,
      toggleShow,
      modalEl,
    };
  },
};
</script>

<style scoped>
/* ensure box-sizing and containment */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 14, 18, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 460px;
  min-width: 0;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow);
  text-align: left;
}

.modal h3 {
  margin: 0 0 12px;
  color: var(--text-h);
  font-size: 18px;
  font-weight: 700;
}

.modal-body {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

/* input takes all available width, and never exceeds modal */
.modal-body input {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 15px;
  line-height: 1.4;
  background: var(--surface);
}

/* visibility toggle is a compact button to the right of input */
.toggle-visibility {
  flex: 0 0 auto;
  height: 40px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--muted);
}

/* actions */
.buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn {
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--navy);
}

.btn-primary {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: #fff;
  border-color: transparent;
}

.error {
  color: var(--danger);
  margin-top: 10px;
  font-size: 13px;
  word-break: break-word;
  white-space: normal;
}

/* mobile constraints */
@media (max-width: 480px) {
  .modal {
    max-width: calc(100% - 32px);
    padding: 16px;
  }
  .buttons {
    gap: 6px;
  }
  .toggle-visibility {
    height: 36px;
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
