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
                    <span v-if="place.eventstartdate">{{ formatEventDate(place.eventstartdate) }}</span>
                    <span v-if="place.eventenddate && place.eventstartdate && place.eventenddate !== place.eventstartdate">
                      ~ {{ formatEventDate(place.eventenddate) }}</span>
                    <span v-else-if="!place.eventstartdate && place.eventenddate">
                      {{ formatEventDate(place.eventenddate) }}</span>
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

          <!-- 축제공연행사 전용 상세 섹션 (전체 너비 카드) -->
          <section
            v-if="isFestival && hasFestivalDetails"
            class="festival-details card"
            aria-labelledby="festival-details-title"
            style="margin-top: 18px"
          >
            <h2 id="festival-details-title" class="festival-details-title">행사 상세 정보</h2>

            <dl class="festival-info-grid">
              <div
                v-if="showEventPlace"
                class="festival-info-item"
              >
                <dt>행사 장소</dt>
                <dd>{{ place.eventplace }}</dd>
              </div>

              <div
                v-if="hasValue(place.playtime)"
                class="festival-info-item"
              >
                <dt>공연 시간</dt>
                <dd>{{ place.playtime }}</dd>
              </div>

              <div
                v-if="hasValue(place.agelimit)"
                class="festival-info-item"
              >
                <dt>관람 연령</dt>
                <dd>{{ place.agelimit }}</dd>
              </div>

              <div
                v-if="hasValue(place.festivalgrade)"
                class="festival-info-item"
              >
                <dt>축제 등급</dt>
                <dd>{{ place.festivalgrade }}</dd>
              </div>

              <div
                v-if="hasValue(place.spendtimefestival)"
                class="festival-info-item"
              >
                <dt>관람 소요 시간</dt>
                <dd>{{ place.spendtimefestival }}</dd>
              </div>

              <div
                v-if="hasValue(place.usetimefestival)"
                class="festival-info-item"
              >
                <dt>이용 요금</dt>
                <dd>{{ place.usetimefestival }}</dd>
              </div>

              <div
                v-if="hasValue(place.discountinfofestival)"
                class="festival-info-item"
              >
                <dt>할인 정보</dt>
                <dd>{{ place.discountinfofestival }}</dd>
              </div>

              <div
                v-if="hasValue(place.bookingplace)"
                class="festival-info-item"
              >
                <dt>예매처</dt>
                <dd>{{ place.bookingplace }}</dd>
              </div>
            </dl>

            <div
              v-if="hasValue(place.program)"
              class="festival-section"
            >
              <h3>프로그램</h3>
              <p class="festival-description">{{ place.program }}</p>
            </div>

            <div
              v-if="hasValue(place.subevent)"
              class="festival-section"
            >
              <h3>부대 행사</h3>
              <p class="festival-description">{{ place.subevent }}</p>
            </div>

            <div
              v-if="hasValue(place.placeinfo)"
              class="festival-section"
            >
              <h3>행사장 안내</h3>
              <p class="festival-description">{{ place.placeinfo }}</p>
            </div>

            <div
              v-if="hasSponsorInfo"
              class="festival-section"
            >
              <h3>주최·주관</h3>

              <p v-if="hasValue(place.sponsor1)">
                주최: {{ place.sponsor1 }}
                <span v-if="showSponsor1Tel"> · {{ place.sponsor1tel }}</span>
              </p>

              <p v-if="hasValue(place.sponsor2)">
                주관: {{ place.sponsor2 }}
                <span v-if="showSponsor2Tel"> · {{ place.sponsor2tel }}</span>
              </p>
            </div>

            <a
              v-if="festivalHomepage"
              :href="festivalHomepage"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary festival-homepage"
              style="margin-top:16px;"
            >
              공식 홈페이지 바로가기
            </a>
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
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "../components/AppHeader.vue";
import BackButton from "../components/BackButton.vue";
import { getPlace } from "../api/content.js";
import formatDateToKorean from "../utils/formatDate.js";
import PlaceKakaoMap from "../components/PlaceKakaoMap.vue";

const route = useRoute();

// Make id reactive so component reacts when route param changes
const id = computed(() => route.params.id);

const place = ref(null);
const loading = ref(false);
const error = ref("");

// 기존의 formatShortDate는 이벤트용 날짜 포맷으로 대체 처리
function formatEventDate(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{8}$/.test(text)) {
    return text;
  }
  return `${text.slice(0, 4)}.${text.slice(4, 6)}.${text.slice(6, 8)}`;
}

function formatShortDate(raw) {
  const v = formatDateToKorean(raw);
  return v || raw || "";
}

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}

// 축제 여부 판단 (contenttypeid 또는 contentTypeId 또는 contentType)
const isFestival = computed(() => {
  const typeId =
    place.value?.contenttypeid ??
    place.value?.contentTypeId ??
    place.value?.contenttypeId;

  return (
    String(typeId ?? "") === "15" ||
    place.value?.contentType === "축제공연행사" ||
    place.value?.contenttype === "축제공연행사"
  );
});

// 축제 관련 필드 중 실제로 하나라도 값이 있으면 섹션 표시
const festivalFieldKeys = [
  "eventplace",
  "playtime",
  "program",
  "subevent",
  "sponsor1",
  "sponsor1tel",
  "sponsor2",
  "sponsor2tel",
  "eventhomepage",
  "bookingplace",
  "agelimit",
  "festivalgrade",
  "placeinfo",
  "spendtimefestival",
  "discountinfofestival",
  "usetimefestival",
];

const hasFestivalDetails = computed(() => {
  if (!place.value || !isFestival.value) return false;
  return festivalFieldKeys.some((k) => hasValue(place.value?.[k]));
});

const showEventPlace = computed(() => {
  if (!hasValue(place.value?.eventplace)) return false;
  const ev = String(place.value.eventplace).replace(/\s+/g, "").toLowerCase();
  const addr1 = String(place.value?.addr1 ?? "").replace(/\s+/g, "").toLowerCase();
  const addr2 = String(place.value?.addr2 ?? "").replace(/\s+/g, "").toLowerCase();
  const addrCombined = (addr1 + addr2).replace(/\s+/g, "");
  if (addr1 && (ev === addr1 || ev === addrCombined)) return false;
  return true;
});

const hasSponsorInfo = computed(() => {
  if (!place.value) return false;
  return (
    hasValue(place.value.sponsor1) ||
    hasValue(place.value.sponsor1tel) ||
    hasValue(place.value.sponsor2) ||
    hasValue(place.value.sponsor2tel)
  );
});
const showSponsor1Tel = computed(() => {
  if (!hasValue(place.value?.sponsor1tel)) return false;
  if (!hasValue(place.value?.tel)) return true;
  return String(place.value.sponsor1tel).trim() !== String(place.value.tel).trim();
});
const showSponsor2Tel = computed(() => {
  if (!hasValue(place.value?.sponsor2tel)) return false;
  if (!hasValue(place.value?.tel)) return true;
  return String(place.value.sponsor2tel).trim() !== String(place.value.tel).trim();
});

const festivalHomepage = computed(() => {
  if (!hasValue(place.value?.eventhomepage)) return null;
  let s = String(place.value.eventhomepage).trim();
  const m = s.match(/href=["']([^"']+)["']/i);
  if (m && m[1]) s = m[1].trim();
  if (/^https?:\/\//i.test(s)) return s;
  return null;
});

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
  const idVal = id.value;
  if (!idVal) {
    place.value = null;
    error.value = "잘못된 장소 요청입니다.";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const res = await getPlace(idVal);
    place.value = res.item || null;
    if (!place.value) {
      error.value = "장소를 찾을 수 없습니다.";
    }
  } catch (e) {
    error.value = "장소 정보를 불러오지 못했습니다.";
    place.value = null;
  } finally {
    loading.value = false;
  }
}

// Load on mount and reload whenever route param `id` changes
onMounted(load);
watch(id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    load();
  }
});
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
  height: 422px;
  box-sizing: border-box;
}
.place-core .card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  box-sizing: border-box;
  padding-bottom: 12px;
}

/* festival styles */
.festival-details {
  margin-top: 24px;
  padding: 20px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e6e6e6);
  border-radius: 8px;
}
.festival-details-title {
  margin: 0 0 14px;
  color: var(--navy);
  font-size: 18px;
}
.festival-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 0;
}
.festival-info-item {
  min-width: 0;
}
.festival-info-item dt {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 13px;
}
.festival-info-item dd {
  margin: 0;
  color: var(--navy);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.festival-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.festival-section h3 {
  margin: 0 0 8px;
  font-size: 15px;
}
.festival-description {
  margin: 0;
  white-space: pre-line;
  word-break: keep-all;
  overflow-wrap: anywhere;
  line-height: 1.7;
}

.festival-homepage {
  display: inline-block;
}

@media (max-width: 1024px) {
  .place-detail {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .festival-details {
    padding: 16px;
  }
  .festival-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>