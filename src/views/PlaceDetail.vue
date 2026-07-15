
<template>
  <div>
    <AppHeader />
    <main
      class="container page"
      style="padding-top: 18px; padding-bottom: 32px">
      <BackButton :fallback="'/places'" />

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <div v-else-if="place" class="place-detail">
        <section>
          <div class="place-hero">
            <img
              v-if="place.firstimage2 || place.firstimage"
              :src="place.firstimage2 || place.firstimage"
              class="media"
              :alt="place.title" />
            <div
              v-else
              style="
                height: 420px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
              <div style="text-align: center">
                <div style="font-size: 56px">
                  {{ emojiFor(place.contentType) }}
                </div>
                <div class="caption">대표 이미지가 없습니다</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 16px">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
              ">
              <div>
                <div style="display: flex; align-items: center; gap: 12px">
                  <span class="badge">{{ place.contentType || "" }}</span>
                  <h1 class="h-page" style="margin: 0">{{ place.title }}</h1>
                </div>
                <div class="caption" style="margin-top: 8px">
                  {{ place.addr1 || "" }}
                  <span v-if="place.addr2">, {{ place.addr2 }}</span>
                </div>
              </div>

              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  align-items: flex-start;
                ">
                <a
                  v-if="place.homepage || place.eventhomepage"
                  :href="place.homepage || place.eventhomepage"
                  target="_blank"
                  class="btn btn-outline"
                  >홈페이지 방문</a
                >
                <div v-if="place.tel" class="caption" style="margin-bottom: 8px">
                  <strong>문의</strong>
                  <div class="body-text">{{ place.tel }}</div>
                </div>
                <div
                v-if="place.eventstartdate || place.eventenddate"
                class="caption">
                <strong>행사 기간</strong>
                <div class="body-text">
                  <span v-if="place.eventstartdate">{{
                    formatShortDate(place.eventstartdate)
                  }}</span>
                  <span v-if="place.eventenddate">
                    ~ {{ formatShortDate(place.eventenddate) }}</span
                  >
                </div>
              </div>
              </div>
            </div>
          </div>

          <section v-if="hasOverview" style="margin-top: 18px">
            <div class="card">
              <h3 class="h-section" style="margin: 0 0 8px">소개</h3>
              <div class="body-text" v-html="sanitizedOverview"></div>
            </div>
          </section>
        </section>

        <aside class="place-core">
          <div class="card">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
              <div style="font-weight: 600; color: var(--navy)">핵심 정보</div>
              <div class="caption">
                {{ place.sigungucode ? place.sigungucode : "" }}
              </div>
            </div>
            <div style="margin-top: 12px">
              <div
                v-if="place.addr1"
                class="caption"
                style="margin-bottom: 8px">
                <strong>주소</strong>
                <div class="body-text">
                  {{ place.addr1
                  }}<span v-if="place.addr2">, {{ place.addr2 }}</span>
                </div>
              </div>
              <PlaceKakaoMap :place="place" />
            </div>
          </div>

          
        </aside>
      </div>

      <div v-else class="state">장소를 찾을 수 없습니다.</div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "../components/AppHeader.vue";
import BackButton from "../components/BackButton.vue";
import { getPlace } from "../api/content.js";
import formatDateToKorean from "../utils/formatDate.js";
import PlaceKakaoMap from "../components/PlaceKakaoMap.vue";

const route = useRoute();
const id = route.params.id;
const place = ref(null);
const loading = ref(false);
const error = ref("");

function formatShortDate(raw) {
  const v = formatDateToKorean(raw);
  return v || raw || "";
}

// minimal sanitizer: escape then convert line breaks to paragraphs
function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function safeParagraphs(text) {
  if (!text && text !== 0) return "";
  const escaped = escapeHtml(text);
  return escaped
    .split(/\r?\n/)
    .map((p) => `<p style="margin:8px 0;line-height:1.6;">${p}</p>`)
    .join("");
}

// compute overview from known fields
const hasOverview = computed(() => {
  return !!(
    place.value &&
    (place.value.overview ||
      place.value.description ||
      place.value.intro ||
      place.value.content ||
      place.value.summary)
  );
});
const sanitizedOverview = computed(() => {
  if (!place.value) return "";
  return safeParagraphs(
    place.value.overview ||
      place.value.description ||
      place.value.intro ||
      place.value.content ||
      place.value.summary ||
      "",
  );
});

const infoCards = computed(() => {
  if (!place.value) return [];
  const v = place.value;
  const keys = [
    { title: "운영 시간", value: v.operinfo || v.usetime || v.opentime || "" },
    { title: "휴무일", value: v.openday || v.restdate || "" },
    { title: "이용 요금", value: v.usetime || v.charge || "" },
    { title: "주차", value: v.parkings || v.parking || v.parkinglodging || "" },
    { title: "문의 전화", value: v.tel || v.infoname || "" },
  ];
  return keys.filter((k) => k.value && String(k.value).trim() !== "");
});

function emojiFor(name) {
  const map = {
    관광지: "🏖️",
    문화시설: "🏛️",
    축제공연행사: "🎆",
    여행코스: "🗺️",
    레포츠: "🏄",
    숙박: "🏨",
    쇼핑: "🛍️",
    음식점: "🍽️",
  };
  return map[name] || "📍";
}

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

onMounted(load);
</script>

<style scoped>
.place-detail {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}
.place-hero .media {
  width: 100%;
  height: 420px;
  object-fit: cover;
  display: block;
}

.place-core {
  /* aside 전체를 고정 높이로 맞춤 */
  height: 422px;
  box-sizing: border-box;
}
/* 카드가 내부에서 스크롤되도록 처리 (내용이 넘치면 카드 안에서 스크롤) */
.place-core .card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  box-sizing: border-box;
  padding-bottom: 12px;
}
.place-core .card .caption{
  
}


@media (max-width: 1024px) {
  .place-detail {
    grid-template-columns: 1fr;
  }
}
</style>
