<template>
  <div>
    <button
      class="chat-fab"
      @click="toggle"
      :aria-expanded="open.toString()"
      aria-label="챗봇 열기">
      <svg class="chat-fab-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3C7 3 3 6.58 3 11c0 2.2 1 4.17 2.7 5.67L4 21l4.33-1.7C10 20.22 11 20.5 12 20.5c5 0 9-3.58 9-8.5S17 3 12 3z" />
      </svg>
    </button>

    <div
      v-if="open"
      class="chat-panel"
      :class="{ mobile: isMobile }"
      role="dialog"
      aria-label="LocalHub 챗봇">
      <header class="chat-header">
        <div class="chat-title">LocalHub 챗봇</div>
        <button class="chat-close" @click="toggle" aria-label="닫기">✕</button>
      </header>

      <div class="chat-body" ref="bodyEl" role="log" aria-live="polite">
        <div v-if="messages.length === 0" class="chat-empty">
          궁금한 지역 정보를 물어보세요.
        </div>

        <div v-for="m in messages" :key="m.id" :class="['chat-msg', m.role]">
          <div class="bubble">
            <div class="text">{{ m.text }}</div>
          </div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="send">
        <textarea
          v-model="input"
          @keydown.enter.prevent="onEnter"
          @keydown.shift.enter.stop
          placeholder="메시지를 입력하세요"
          aria-label="메시지 입력" />
        <button class="send" type="submit" :disabled="sending || !input.trim()">
          전송
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
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

    const isMobile = computed(() => window.innerWidth <= 768);

    function toggle() {
      open.value = !open.value;
      if (open.value) nextTick(scrollBottom);
    }

    function pushMessage(role, text) {
      messages.push({ id: idSeq++, role, text, time: Date.now() });
      nextTick(scrollBottom);
    }

    function scrollBottom() {
      if (bodyEl.value) {
        bodyEl.value.scrollTop = bodyEl.value.scrollHeight + 200;
      }
    }

    async function send() {
      const text = input.value.trim();
      if (!text || sending.value) return;
      pushMessage("user", text);
      input.value = "";
      sending.value = true;
      try {
        const res = await postChat({ message: text });
        let reply = "";
        if (!res) throw new Error("no-response");
        if (typeof res === "string") reply = res;
        else if (res.reply) reply = res.reply;
        else if (res.message) reply = res.message;
        else if (res.choices && res.choices[0] && res.choices[0].text)
          reply = res.choices[0].text;
        else reply = JSON.stringify(res);
        pushMessage("bot", reply);
      } catch (err) {
        pushMessage("bot", "현재 챗봇 서비스를 연결할 수 없습니다.");
      } finally {
        sending.value = false;
      }
    }

    function onEnter(e) {
      if (e.shiftKey) {
        const el = e.target;
        const pos = el.selectionStart || 0;
        input.value = input.value.slice(0, pos) + "\n" + input.value.slice(pos);
        nextTick(() => {
          const t = el;
          const newPos = pos + 1;
          t.selectionStart = t.selectionEnd = newPos;
        });
      } else {
        send();
      }
    }

    watch(messages, () => nextTick(scrollBottom));

    onMounted(() => {});

    return {
      open,
      toggle,
      input,
      messages,
      send,
      sending,
      onEnter,
      bodyEl,
      isMobile,
    };
  },
};
</script>

<style scoped>
.chat-fab {
  position: fixed;
  right: 20px;
  bottom: 24px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 70;
  border: none;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
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

/* panel */
.chat-panel {
  position: fixed;
  right: 20px;
  bottom: 90px;
  width: 380px;
  height: 520px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 14px 40px rgba(23, 32, 51, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 70;
  overflow: hidden;
  border: 1px solid var(--border);
}

/* mobile full-screen */
.chat-panel.mobile {
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: auto;
  height: 100%;
  border-radius: 0;
}

/* header */
.chat-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chat-title {
  font-weight: 700;
  color: var(--navy);
}
.chat-close {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 18px;
}

/* body */
.chat-body {
  flex: 1;
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-empty {
  color: var(--muted);
  padding: 12px;
}

/* messages */
.chat-msg {
  display: flex;
}
.chat-msg.bot {
  justify-content: flex-start;
}
.chat-msg.user {
  justify-content: flex-end;
}
.bubble {
  max-width: 78%;
}
.bubble .text {
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.6;
}
.chat-msg.bot .text {
  background: var(--mint);
  color: var(--navy);
}
.chat-msg.user .text {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: #fff;
}

/* input */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--border);
  align-items: flex-end;
}
.chat-input textarea {
  flex: 1;
  min-height: 46px;
  max-height: 120px;
  resize: none;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 14px;
}
.chat-input .send {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}
.chat-input .send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* responsive */
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
    width: 100%;
    max-width: 680px;
    height: 86vh;
  }
}
</style>
