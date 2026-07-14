<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/places'" />

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <div v-else-if="place" class="detail-card">
        <div class="media">
          <img
            v-if="place.firstimage2 || place.firstimage"
            :src="place.firstimage2 || place.firstimage"
            :alt="place.title" />
          <div v-else class="media-placeholder">이미지가 없습니다</div>
        </div>

        <div class="header-row">
          <h1 class="title">{{ place.title }}</h1>
          <span v-if="place.contentType" class="badge">{{
            place.contentType
          }}</span>
        </div>

        <div class="info-grid">
          <div v-if="place.addr1" class="info-row">
            <strong>주소</strong>
            <div>
              {{ place.addr1 }}
              <span v-if="place.addr2">, {{ place.addr2 }}</span>
            </div>
          </div>

          <div v-if="place.tel" class="info-row">
            <strong>전화번호</strong>
            <div>{{ place.tel }}</div>
          </div>

          <div v-if="place.homepage || place.eventhomepage" class="info-row">
            <strong>홈페이지</strong>
            <div>
              <a
                :href="place.homepage || place.eventhomepage"
                target="_blank"
                rel="noopener noreferrer"
                >홈페이지 방문</a
              >
            </div>
          </div>

          <div
            v-if="
              place.tourinfocenter ||
              place.infocenter ||
              place.infocenter ||
              place.placeinfo
            "
            class="info-row">
            <strong>안내</strong>
            <div>
              {{
                place.tourinfocenter ||
                place.infocenter ||
                place.placeinfo ||
                ""
              }}
            </div>
          </div>

          <div
            v-if="place.operinfo || place.openday || place.usetime"
            class="info-row">
            <strong>운영 정보</strong>
            <div>{{ place.operinfo || place.usetime || place.openday }}</div>
          </div>

          <div
            v-if="place.parkings || place.parking || place.parkinglodging"
            class="info-row">
            <strong>주차</strong>
            <div>
              {{ place.parkings || place.parking || place.parkinglodging }}
            </div>
          </div>

          <div v-if="place.agelimit || place.reservation" class="info-row">
            <strong>기타</strong>
            <div>{{ place.agelimit || place.reservation }}</div>
          </div>

          <div
            v-if="place.eventstartdate || place.eventenddate"
            class="info-row">
            <strong>행사 날짜</strong>
            <div>
              <span v-if="place.eventstartdate">{{
                formatShortDate(place.eventstartdate)
              }}</span>
              <span v-if="place.eventenddate">
                ~ {{ formatShortDate(place.eventenddate) }}</span
              >
            </div>
          </div>
        </div>

        <div v-if="place.overview || place.content" class="section">
          <h3>소개</h3>
          <div
            class="desc"
            v-html="safeText(place.overview || place.content)"></div>
        </div>
      </div>

      <div v-else class="state">장소를 찾을 수 없습니다.</div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import BackButton from "../components/BackButton.vue";
import { getPlace } from "../api/content.js";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "PlaceDetail",
  components: { AppHeader, BackButton },
  setup(props, { attrs }) {
    const route = attrs?.route; // not used; we will use window.location via router normally
    const id = typeof window !== "undefined" && window.location ? null : null; // placeholder
    const place = ref(null);
    const loading = ref(false);
    const error = ref("");

    // We obtain the id from the route params via global route (use useRoute inside composition)
    // but as setup doesn't import useRoute (and to keep consistent with existing project), we will get via location path fallback
    // Simpler: import useRoute
    return; // will be replaced below
  },
};
</script>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "../components/AppHeader.vue";
import BackButton from "../components/BackButton.vue";
import { getPlace } from "../api/content.js";
import formatDateToKorean from "../utils/formatDate.js";

const route = useRoute();
const id = route.params.id;
const place = ref(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getPlace(id);
    place.value = res.item || null;
  } catch (e) {
    error.value = "장소 정보를 불러오지 못했습니다.";
    place.value = null;
  } finally {
    loading.value = false;
  }
}

function formatShortDate(raw) {
  const v = formatDateToKorean(raw);
  return v || raw || "";
}

// sanitize HTML-ish strings: do not render raw HTML; preserve line breaks and escape
function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function safeText(text) {
  if (!text && text !== 0) return "";
  const escaped = escapeHtml(text);
  // preserve paragraph breaks
  return escaped
    .split(/\r?\n/)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

onMounted(load);
</script>

<style scoped>
.container {
  max-width: 1126px;
  margin: 28px auto;
  padding: 0 20px;
}
.detail-card {
  background: white;
  padding: 18px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.media img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 8px;
}
.media-placeholder {
  width: 100%;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f7fb;
  border-radius: 8px;
  color: var(--text);
}
.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}
.title {
  margin: 0;
  font-size: 24px;
  color: var(--text-h);
}
.badge {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 6px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.info-row {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.section {
  margin-top: 12px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.desc p {
  margin: 8px 0;
  color: var(--text);
  line-height: 1.6;
}

/* responsive single column on small screens */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
