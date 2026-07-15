<template>
  <div>
    <button
      class="chat-fab"
      @click="toggle"
      :aria-expanded="open.toString()"
      aria-label="챗봇 열기"
    >
      <svg class="chat-fab-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3C7 3 3 6.58 3 11c0 2.2 1 4.17 2.7 5.67L4 21l4.33-1.7C10 20.22 11 20.5 12 20.5c5 0 9-3.58 9-8.5S17 3 12 3z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="chat-panel"
      :class="{ mobile: isMobile }"
      role="dialog"
      aria-label="LocalHub 챗봇"
    >
      <header class="chat-header">
        <div class="chat-title">LocalHub 챗봇</div>

        <button
          class="chat-close"
          type="button"
          @click="toggle"
          aria-label="닫기"
        >
          ✕
        </button>
      </header>

      <div
        ref="bodyEl"
        class="chat-body"
        role="log"
        aria-live="polite"
      >
        <div v-if="messages.length === 0" class="chat-empty">
          궁금한 지역 정보를 물어보세요.
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          :class="['chat-msg', message.role]"
        >
          <div class="bubble">
            <div
              v-if="message.html"
              class="text html-content"
              v-html="message.html"
            ></div>

            <div v-else class="text">
              {{ message.text }}
            </div>
          </div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="send">
        <textarea
          v-model="input"
          @keydown.enter.prevent="onEnter"
          @keydown.shift.enter.stop
          placeholder="메시지를 입력하세요"
          aria-label="메시지 입력"
        ></textarea>

        <button
          class="send"
          type="submit"
          :disabled="sending || !input.trim()"
        >
          전송
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { postChat } from "../api/chat.js";

let idSeq = 1;

export default {
  name: "ChatBotWidget",

  setup() {
    const open = ref(false);
    const input = ref("");
    const messages = reactive([]);
    const sending = ref(false);
    const bodyEl = ref(null);

    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(max-width: 480px)")
        : null;

    const isMobile = ref(mq ? mq.matches : false);

    function mqHandler(event) {
      isMobile.value = event.matches;
    }

    onMounted(() => {
      if (!mq) {
        return;
      }

      if (mq.addEventListener) {
        mq.addEventListener("change", mqHandler);
      } else {
        mq.addListener(mqHandler);
      }
    });

    onUnmounted(() => {
      if (!mq) {
        return;
      }

      if (mq.removeEventListener) {
        mq.removeEventListener("change", mqHandler);
      } else {
        mq.removeListener(mqHandler);
      }
    });

    function toggle() {
      open.value = !open.value;

      if (open.value) {
        nextTick(scrollBottom);
      }
    }

    function pushMessage(role, text, html = null) {
      messages.push({
        id: idSeq++,
        role,
        text,
        html,
        time: Date.now(),
      });

      nextTick(scrollBottom);
    }

    function scrollBottom() {
      if (!bodyEl.value) {
        return;
      }

      bodyEl.value.scrollTop = bodyEl.value.scrollHeight;
    }

    function extractAnswer(response) {
      if (response == null) {
        return "";
      }

      if (typeof response === "string") {
        try {
          const parsed = JSON.parse(response);

          if (parsed == null) {
            return response;
          }

          return (
            parsed.answer ??
            parsed.reply ??
            parsed.message ??
            parsed.choices?.[0]?.text ??
            response
          );
        } catch {
          return response;
        }
      }

      if (typeof response === "object") {
        return (
          response.answer ??
          response.reply ??
          response.message ??
          response.choices?.[0]?.text ??
          String(response)
        );
      }

      return String(response);
    }

    async function send() {
      const text = input.value.trim();

      if (!text || sending.value) {
        return;
      }

      pushMessage("user", text);
      input.value = "";
      sending.value = true;

      try {
        const response = await postChat({
          message: text,
        });

        const answer = extractAnswer(response);

        pushMessage("bot", answer);
      } catch {
        pushMessage(
          "bot",
          "현재 챗봇 서비스를 연결할 수 없습니다.",
        );
      } finally {
        sending.value = false;
      }
    }

    function onEnter(event) {
      if (event.shiftKey) {
        const element = event.target;
        const position = element.selectionStart || 0;

        input.value =
          input.value.slice(0, position) +
          "\n" +
          input.value.slice(position);

        nextTick(() => {
          const newPosition = position + 1;

          element.selectionStart = newPosition;
          element.selectionEnd = newPosition;
        });

        return;
      }

      send();
    }

    watch(messages, () => {
      nextTick(scrollBottom);
    });

    return {
      open,
      input,
      messages,
      sending,
      bodyEl,
      isMobile,
      toggle,
      send,
      onEnter,
    };
  },
};
</script>

<style scoped>
.chat-fab {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 70;
  width: 54px;
  height: 54px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--primary),
    var(--primary-hover)
  );
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.14);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.chat-fab:hover {
  transform: scale(1.04);
}

.chat-fab:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.16);
  outline-offset: 2px;
}

.chat-fab-icon {
  width: 22px;
  height: 22px;
  color: #fff;
}

/* 챗봇 패널 */
.chat-panel {
  position: fixed;
  right: 20px;
  bottom: 90px;
  z-index: 70;
  width: 380px;
  height: 520px;
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--surface);
  box-shadow: 0 14px 40px rgba(23, 32, 51, 0.12);
}

/* 모바일 전체 화면 */
.chat-panel.mobile {
  inset: 0;
  width: auto;
  height: 100dvh;
  border-radius: 0;
}

/* 헤더 */
.chat-header {
  flex-shrink: 0;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  color: var(--navy);
  font-weight: 700;
}

.chat-close {
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

/* 대화 영역 */
.chat-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

.chat-empty {
  padding: 12px;
  color: var(--muted);
}

/* 메시지 한 줄 */
.chat-msg {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.chat-msg.bot {
  justify-content: flex-start;
}

.chat-msg.user {
  justify-content: flex-end;
}

/* 메시지 말풍선 */
.bubble {
  display: inline-flex;
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
  max-width: 78%;
  height: auto;
  box-sizing: border-box;
}

.chat-msg.user .bubble {
  align-self: flex-end;
  width: auto;
  min-width: 0;
  max-width: 80%;
  min-height: 0;
  height: auto;
}

.chat-msg.bot .bubble {
  max-width: 85%;
}

/* 실제 메시지 텍스트 */
.bubble .text {
  display: block;
  width: auto;
  min-width: 0;
  max-width: 100%;
  height: auto;
  margin: 0;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.chat-msg.bot .text {
  background: var(--mint);
  color: var(--navy);
}

.chat-msg.user .text {
  background: linear-gradient(
    90deg,
    var(--primary),
    var(--primary-hover)
  );
  color: #fff;
}

/*
  v-html로 생성된 요소는 scoped 속성을 직접 받지 않으므로
  :deep()을 사용해 기본 문단 여백을 제거한다.
*/
.html-content :deep(p) {
  margin: 0;
}

.html-content :deep(p + p) {
  margin-top: 8px;
}

.html-content :deep(span),
.html-content :deep(a),
.html-content :deep(pre),
.html-content :deep(code) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.html-content :deep(pre),
.html-content :deep(code) {
  padding: 0;
  margin: 0;
  border-radius: 8px;
  overflow-x: hidden;
  background: transparent;
  white-space: pre-wrap;
}

/* 입력 영역 */
.chat-input {
  flex-shrink: 0;
  padding: 10px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}

.chat-input textarea {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  height: 46px;
  min-height: 46px;
  max-height: 46px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-sizing: border-box;
  resize: none;
  overflow-y: hidden;
  font: inherit;
  font-size: 14px;
  line-height: 44px;
}

.chat-input .send {
  flex: 0 0 auto;
  height: 46px;
  min-height: 46px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: linear-gradient(
    90deg,
    var(--primary),
    var(--primary-hover)
  );
  color: white;
  cursor: pointer;
}

.chat-input .send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-fab {
    right: 16px;
    bottom: 16px;
    width: 52px;
    height: 52px;
  }

  .chat-panel {
    right: 12px;
    bottom: 84px;
    width: calc(100vw - 24px);
    max-width: 680px;
    height: 86vh;
  }
}

@media (max-width: 480px) {
  .chat-fab {
    right: 16px;
    bottom: 16px;
    width: 52px;
    height: 52px;
  }

  .chat-panel,
  .chat-panel.mobile {
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }

  .chat-body {
    padding: 12px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .chat-input {
    padding-bottom: calc(
      env(safe-area-inset-bottom, 0px) + 12px
    );
  }
}
</style>