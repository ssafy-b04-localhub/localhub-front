<template>
  <div>
    <div class="chat-fab" @click="toggle">
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path
          fill="#fff"
          d="M12 3C7 3 3 6.58 3 11c0 2.2 1 4.17 2.7 5.67L4 21l4.33-1.7C10 20.22 11 20.5 12 20.5c5 0 9-3.58 9-8.5S17 3 12 3z" />
      </svg>
    </div>

    <div v-if="open" :class="['chat-panel', isMobile ? 'mobile' : 'desktop']">
      <div class="chat-header">
        <div class="title">LocalHub 챗봇</div>
        <button class="close" @click="toggle">✕</button>
      </div>

      <div class="chat-body" ref="bodyEl">
        <div v-if="messages.length === 0" class="chat-empty">
          궁금한 지역 정보를 물어보세요.
        </div>
        <div v-for="m in messages" :key="m.id" :class="['chat-msg', m.role]">
          <div class="text">{{ m.text }}</div>
        </div>
      </div>

      <div class="chat-input">
        <textarea
          v-model="input"
          @keydown.enter.prevent="onEnter"
          @keydown.shift.enter.stop
          :placeholder="
            sending ? '전송 중...' : '메시지를 입력하세요'
          "></textarea>
        <button class="send" @click="send" :disabled="sending || !input.trim()">
          전송
        </button>
      </div>
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
    }

    function pushMessage(role, text) {
      messages.push({ id: idSeq++, role, text, time: Date.now() });
      nextTick(() => scrollBottom());
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
        // call backend chat API
        const res = await postChat({ message: text });
        // res format unknown; attempt to read sensible field(s)
        // Prefer known keys, fallback to stringification
        let reply = "";
        if (!res) {
          throw new Error("no-response");
        } else if (typeof res === "string") {
          reply = res;
        } else if (res.reply) {
          reply = res.reply;
        } else if (res.message) {
          reply = res.message;
        } else if (res.choices && res.choices[0] && res.choices[0].text) {
          reply = res.choices[0].text;
        } else {
          reply = JSON.stringify(res);
        }
        pushMessage("bot", reply);
      } catch (err) {
        pushMessage("bot", "현재 챗봇 서비스를 연결할 수 없습니다.");
      } finally {
        sending.value = false;
      }
    }

    function onEnter(e) {
      if (e.shiftKey) {
        // newline
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

    // keep scroll updated
    watch(messages, () => nextTick(scrollBottom));

    // close panel on small-screen back button navigation (optional)
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
  width: 56px;
  height: 56px;
  background: #0b63d6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow);
  z-index: 70;
}

.chat-panel {
  position: fixed;
  right: 20px;
  bottom: 90px;
  width: 360px;
  height: 520px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  z-index: 70;
  overflow: hidden;
}

.chat-panel.mobile {
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: auto;
  height: 100%;
  border-radius: 0;
}

.chat-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chat-header .title {
  font-weight: 700;
  color: var(--text-h);
}
.chat-header .close {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 18px;
}

.chat-body {
  flex: 1;
  padding: 12px;
  overflow: auto;
}
.chat-empty {
  color: var(--text);
  font-size: 14px;
  padding: 12px;
}

.chat-msg {
  margin-bottom: 12px;
  display: flex;
}
.chat-msg.user {
  justify-content: flex-end;
}
.chat-msg.bot {
  justify-content: flex-start;
}
.chat-msg .text {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f4f7fb;
  color: var(--text);
}
.chat-msg.user .text {
  background: #0b63d6;
  color: white;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--border);
}
.chat-input textarea {
  flex: 1;
  min-height: 46px;
  max-height: 120px;
  resize: none;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.chat-input .send {
  background: #0b63d6;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.chat-input .send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
