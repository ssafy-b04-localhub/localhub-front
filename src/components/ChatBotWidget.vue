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
        <div class="chat-title">
          LocalHub 챗봇
          <span v-if="sending" class="chat-loading-indicator"> 답변을 불러오는 중…</span>
        </div>

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
            <div v-if="message.html" class="text html-content" v-html="message.html"></div>
            <div v-else class="text">{{ message.text }}</div>

            <div v-if="message.sources && message.sources.length" class="chat-sources">
              <div class="sources-title">참고자료</div>
              <ul>
                <li v-for="(s, i) in visibleSources(message)" :key="i" class="source-item">
                  <!-- SPA 네비게이션: 클릭 시 router.push로 이동. 단축키/중간버튼은 기본 동작 허용 -->
                  <a
                    v-if="s.contentid"
                    href="#"
                    class="source-link"
                    @click.prevent="openPlaceFromChat($event, s.contentid)"
                    rel="noopener noreferrer"
                  >
                    <div class="thumb-wrap">
                      <img
                        v-if="s.thumb"
                        :src="s.thumb"
                        alt=""
                        class="source-thumb"
                        loading="lazy"
                      />
                      <div v-else class="thumb-placeholder" aria-hidden="true"></div>
                    </div>

                    <div class="source-body">
                      <div class="source-title">{{ s.title || "제목없음" }}</div>

                      <div v-if="isFestivalSource(s)" class="source-meta-block">
                        <div v-if="s.addr || s.region" class="source-line-addr">
                          {{ s.addr || s.region }}
                        </div>
                        <div v-if="s.eventstartdate || s.eventenddate" class="source-line-date">
                          {{ formatEventDate(s.eventstartdate) }}
                          <span v-if="s.eventenddate && s.eventenddate !== s.eventstartdate"> ~ {{ formatEventDate(s.eventenddate) }}</span>
                        </div>
                      </div>

                      <div v-else class="source-meta-line">
                        <span v-if="s.addr" class="source-region">{{ s.addr }}</span>
                        <span v-else-if="s.region" class="source-region">{{ s.region }}</span>
                        <span v-else-if="s.eventstartdate || s.eventenddate" class="source-date-inline">
                          {{ formatEventDate(s.eventstartdate) }}
                          <span v-if="s.eventenddate && s.eventenddate !== s.eventstartdate"> ~ {{ formatEventDate(s.eventenddate) }}</span>
                        </span>
                      </div>
                    </div>
                  </a>

                  <div v-else class="source-no-link">
                    <div class="thumb-wrap">
                      <img v-if="s.thumb" :src="s.thumb" alt="" class="source-thumb" loading="lazy" />
                      <div v-else class="thumb-placeholder" aria-hidden="true"></div>
                    </div>

                    <div class="source-body">
                      <div class="source-title">{{ s.title || "제목없음" }}</div>

                      <div v-if="isFestivalSource(s)" class="source-meta-block">
                        <div v-if="s.addr || s.region" class="source-line-addr">
                          {{ s.addr || s.region }}
                        </div>
                        <div v-if="s.eventstartdate || s.eventenddate" class="source-line-date">
                          {{ formatEventDate(s.eventstartdate) }}
                          <span v-if="s.eventenddate && s.eventenddate !== s.eventstartdate"> ~ {{ formatEventDate(s.eventenddate) }}</span>
                        </div>
                      </div>

                      <div v-else class="source-meta-line">
                        <span v-if="s.addr" class="source-region">{{ s.addr }}</span>
                        <span v-else-if="s.region" class="source-region">{{ s.region }}</span>
                        <span v-else-if="s.eventstartdate || s.eventenddate" class="source-date-inline">
                          {{ formatEventDate(s.eventstartdate) }}
                          <span v-if="s.eventenddate && s.eventenddate !== s.eventstartdate"> ~ {{ formatEventDate(s.eventenddate) }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>

              <button
                v-if="message.sources.length > maxSources"
                class="sources-toggle"
                type="button"
                @click="toggleSources(message)"
              >
                {{ message.showAllSources ? '접기' : `더보기 (${message.sources.length})` }}
              </button>
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
import { useRouter } from "vue-router";
import api from "../api/index.js";
import { postChat } from "../api/chat.js";

let idSeq = 1;
const MAX_SOURCES_DEFAULT = 5;

export default {
  name: "ChatBotWidget",

  setup() {
    const router = useRouter();
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

    const maxSources = MAX_SOURCES_DEFAULT;

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

    function pushMessage(role, text, html = null, sources = null) {
      const msg = {
        id: idSeq++,
        role,
        text,
        html,
        time: Date.now(),
        sources: Array.isArray(sources) ? sources : [],
        showAllSources: false,
      };
      messages.push(msg);
      nextTick(scrollBottom);
      return msg.id;
    }

    function replaceMessageText(id, text, html = null, sources = null) {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx === -1) {
        // fallback: push new
        pushMessage("bot", text, html, sources);
        return;
      }
      // directly mutate reactive array element
      messages[idx].text = text;
      messages[idx].html = html;
      messages[idx].time = Date.now();
      messages[idx].sources = Array.isArray(sources) ? sources : messages[idx].sources || [];
      // ensure showAllSources default false after replace
      if (!messages[idx].hasOwnProperty("showAllSources")) messages[idx].showAllSources = false;
      nextTick(scrollBottom);
    }

    function scrollBottom() {
      if (!bodyEl.value) {
        return;
      }

      bodyEl.value.scrollTop = bodyEl.value.scrollHeight;
    }

    function escapeHtml(unsafe) {
      if (!unsafe && unsafe !== 0) return "";
      return String(unsafe)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function replyToHtml(replyText) {
      if (!replyText && replyText !== 0) return "";
      let s = String(replyText);
      s = s.replace(/\r\n/g, "\n");
      if (s.includes(" / ")) {
        const parts = s.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
        const shortEnough = parts.length > 1 && parts.every(p => p.length < 300);
        if (shortEnough) {
          const lis = parts.map(p => `<li>${escapeHtml(p).replace(/\n/g, "<br>")}</li>`).join("");
          return `<ul>${lis}</ul>`;
        }
      }
      const paragraphs = s.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      const htmlParagraphs = paragraphs.map(p => {
        const withBr = escapeHtml(p).replace(/\n/g, "<br>");
        return `<p>${withBr}</p>`;
      }).join("");
      return htmlParagraphs || "";
    }

    function formatEventDate(value) {
      const text = String(value ?? "").trim();
      if (!/^\d{8}$/.test(text)) {
        return text;
      }
      return `${text.slice(0,4)}.${text.slice(4,6)}.${text.slice(6,8)}`;
    }

    function isFestivalSource(s) {
      if (!s) return false;
      if (s.eventstartdate || s.eventenddate) return true;
      const t = String(s.contenttypeid ?? s.contentTypeId ?? s.contentType ?? "").toLowerCase();
      return t === "15" || t === "축제공연행사";
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
          return parsed.reply ?? parsed.answer ?? parsed.message ?? response;
        } catch {
          return response;
        }
      }

      if (typeof response === "object") {
        return response.reply ?? response.answer ?? response.message ?? String(response);
      }

      return String(response);
    }

    function visibleSources(message) {
      if (!message || !Array.isArray(message.sources)) return [];
      if (message.showAllSources) return message.sources;
      return message.sources.slice(0, maxSources);
    }

    function toggleSources(message) {
      if (!message) return;
      message.showAllSources = !message.showAllSources;
      nextTick(scrollBottom);
    }

    async function enrichSources(sources) {
      if (!Array.isArray(sources) || sources.length === 0) return sources;
      const tasks = sources.map(async (s) => {
        if (!s || !s.contentid) return s;
        const hasAddr = s.addr && String(s.addr).trim() !== "";
        const hasThumb = s.thumb && String(s.thumb).trim() !== "";
        const hasDate = (s.eventstartdate && String(s.eventstartdate).trim() !== "") || (s.eventenddate && String(s.eventenddate).trim() !== "");
        if (hasAddr && hasThumb && hasDate) return s;

        try {
          const res = await api.get(`/api/places/${encodeURIComponent(String(s.contentid))}`);
          const item = res?.data?.item;
          if (item) {
            return {
              ...s,
              title: s.title || item.title || s.title,
              region: s.region || item.region || s.region,
              addr: s.addr || item.addr1 || item.addr || s.addr,
              thumb: s.thumb || item.firstimage2 || item.firstimage || s.thumb,
              eventstartdate: s.eventstartdate || item.eventstartdate || null,
              eventenddate: s.eventenddate || item.eventenddate || null,
              contenttypeid: s.contenttypeid || item.contenttypeid || item.contentTypeId || s.contenttypeid,
            };
          }
        } catch {
          return s;
        }
        return s;
      });

      const results = await Promise.all(tasks);
      return results;
    }

    // SPA navigation helper: open place detail and mark state.fromChatbot
    function openPlaceFromChat(event, contentid) {
      // allow cmd/ctrl/middle click & shift to open in new tab - fall back to default browser behavior
      const allowDefault = event.metaKey || event.ctrlKey || event.shiftKey || (event.button && event.button === 1);
      const cidStr = String(contentid || "").trim();
      if (!cidStr) return;
      if (allowDefault) {
        // open in new tab as fallback to user expectation
        const url = `/places/${encodeURIComponent(cidStr)}`;
        window.open(url, "_blank", "noopener");
        return;
      }

      // Use router.push with history state so PlaceDetail can detect chatbot entry
      router.push({
        name: "PlaceDetail",
        params: { id: cidStr },
        state: { fromChatbot: true },
      }).catch(() => {});

      // Also close the chat to surface the detail page
      open.value = false;
    }

    async function send() {
      const text = input.value.trim();

      if (!text || sending.value) {
        return;
      }

      pushMessage("user", text);
      input.value = "";

      const placeholderId = pushMessage("bot", "답변을 불러오는 중...", null, []);

      sending.value = true;

      try {
        const response = await postChat({ message: text });

        const replyText = extractAnswer(response) || "응답이 없습니다.";

        const replyHtml = replyToHtml(replyText);

        let sources = Array.isArray(response?.sources) ? response.sources.map(s => ({
          title: s?.title ?? s?.name ?? "",
          region: s?.region ?? "",
          contentid: s?.contentid ?? s?.id ?? null,
          eventstartdate: s?.eventstartdate ?? null,
          eventenddate: s?.eventenddate ?? null,
          thumb: s?.firstimage2 ?? s?.firstimage ?? s?.thumbnail ?? null,
          addr: s?.addr1 ?? s?.addr ?? "",
          contenttypeid: s?.contenttypeid ?? s?.contentTypeId ?? s?.contentType ?? null,
        })) : [];

        if (sources.length > 0) {
          const enriched = await enrichSources(sources);
          sources = enriched;
        }

        replaceMessageText(placeholderId, replyText, replyHtml, sources);
      } catch (err) {
        let msg = "현재 챗봇 서비스를 연결할 수 없습니다.";
        try {
          if (err && err.response && err.response.data && err.response.data.detail) {
            msg = `오류: ${err.response.data.detail}`;
          } else if (err && err.message) {
            msg = `오류: ${err.message}`;
          }
        } catch {
        }
        replaceMessageText(placeholderId, msg, `<p>${escapeHtml(msg)}</p>`, []);
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
      replaceMessageText,
      visibleSources,
      toggleSources,
      maxSources,
      formatEventDate,
      isFestivalSource,
      openPlaceFromChat,
    };
  },
};
</script>

<style scoped>
/* (스타일은 기존 코드 유지 — 생략하지 않고 포함합니다) */

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
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-loading-indicator {
  color: var(--muted);
  font-weight: 500;
  font-size: 13px;
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
  flex-direction: column;
  padding: 0;
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

/* sources (참고자료) */
.chat-sources {
  margin-top: 10px;
  padding-top: 8px;
}
.chat-sources .sources-title {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}
.chat-sources ul {
  margin: 0;
  padding-left: 0;
}
.source-item {
  margin: 6px 0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.source-link, .source-no-link {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
  width: 100%;
}
.thumb-wrap { width:64px; height:64px; flex:0 0 64px; display:flex; align-items:center; justify-content:center; }
.source-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  background: #f3f4f6;
  flex: 0 0 64px;
}
.thumb-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  background: linear-gradient(180deg, #f7fafc, #eef2f7);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.02);
  flex: 0 0 64px;
}
.source-body { flex: 1 1 auto; min-width: 0; }
.source-title { font-weight: 600; color: var(--navy); font-size: 14px; margin-bottom: 6px; }
.source-meta-line { font-size: 12px; color: var(--muted); }
.source-date-inline { color: var(--muted); }

/* festival: two-line meta */
.source-meta-block { display: flex; flex-direction: column; gap: 4px; }
.source-line-addr { font-size: 13px; color: var(--navy); }
.source-line-date { font-size: 12px; color: var(--muted); }

/* 더보기 버튼 */
.sources-toggle {
  margin-top: 8px;
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 6px 0;
}

/* input area */
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
  .thumb-wrap { width:56px; height:56px; flex:0 0 56px; }
  .source-thumb, .thumb-placeholder { width:56px; height:56px; flex:0 0 56px; border-radius:6px; }
}
</style>