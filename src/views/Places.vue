<template>
  <div>
    <AppHeader />
    <main class="container page" aria-labelledby="places-heading">
      <BackButton :fallback="'/'" />

      <section class="page-heading">
        <h1 id="places-heading" class="h-page">부산의 장소를 찾아보세요</h1>
        <p class="caption">
          관광지, 문화시설, 축제 등 원하는 부산 정보를 검색해 보세요.
        </p>
      </section>

      <!-- category chips moved above search (duplicate select removed) -->
      <section class="filters">
        <div class="chips" role="tablist">
          <button
            v-for="(ct, idx) in chipList"
            :key="idx"
            :class="['chip', isSelectedChip(ct) ? 'chip-active' : '']"
            @click="applyChip(ct)"
            type="button"
            role="tab"
            :aria-selected="isSelectedChip(ct) ? 'true' : 'false'">
            {{ ct.label }}
          </button>
        </div>
      </section>

      <section class="search-panel">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="검색어 입력 (예: 해운대, 박물관)"
          @keyup.enter="search"
          aria-label="검색어" />
        <button
          class="search-btn btn btn-primary"
          @click="search"
          type="button">
          검색
        </button>
      </section>

      <section>
        <div v-if="loading" class="state">로딩 중...</div>
        <div v-else-if="error" class="state error">{{ error }}</div>
        <div v-else>
          <div v-if="places.length === 0" class="state">
            검색 결과가 없습니다.
          </div>

          <div class="places-grid" v-else>
            <article
              v-for="p in places"
              :key="p.contentid"
              class="place-card-grid"
              @click="openPlace(p)"
              role="button">
              <img
                v-if="p.firstimage2 || p.firstimage"
                class="place-thumb"
                :src="p.firstimage2 || p.firstimage"
                :alt="p.title" />
              <div v-else class="place-thumb placeholder">
                <div class="placeholder-inner">
                  <div class="placeholder-emoji">
                    {{ emojiFor(p.contentType) }}
                  </div>
                  <div class="caption">이미지 없음</div>
                </div>
              </div>

              <div class="place-body">
                <div class="place-row">
                  <div class="place-info">
                    <div class="card-title">{{ p.title }}</div>
                    <div class="caption addr">{{ p.addr1 || "" }}</div>
                  </div>
                  <div class="place-badge">
                    <div class="badge">{{ p.contentType || "" }}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import PlaceCard from "../components/PlaceCard.vue";
import { getContentTypes, getPlaces } from "../api/content.js";
import { useRoute, useRouter } from "vue-router";
import BackButton from "../components/BackButton.vue";

export default {
  name: "Places",
  components: { AppHeader, PlaceCard, BackButton },
  setup() {
    const contentTypes = ref([]);
    const places = ref([]);
    const loading = ref(false);
    const error = ref("");
    const route = useRoute();
    const router = useRouter();

    const selectedType = ref(
      route.query.content_type ? String(route.query.content_type) : "",
    );
    const keyword = ref(route.query.keyword || "");

    const chipList = ref([]);

    const emojiMap = {
      관광지: "🏖️",
      문화시설: "🏛️",
      축제공연행사: "🎆",
      여행코스: "🗺️",
      레포츠: "🏄",
      숙박: "🏨",
      쇼핑: "🛍️",
      음식점: "🍽️",
    };

    async function loadContentTypes() {
      try {
        const res = await getContentTypes();
        const raw = res.content_types || [];
        // 필터: 정확히 "음식점"인 항목만 제외 (공백 안전 처리)
        contentTypes.value = raw.filter((c) => String(c.name ?? "").trim() !== "음식점");

        chipList.value = [
          { label: "전체", value: "" },
          ...contentTypes.value.map((c) => ({
            label: c.name,
            value: String(c.id),
          })),
        ];

        // 이미 URL에 content_type이 음식점 ID로 들어와 있는 경우 안전하게 초기화
        if (selectedType.value) {
          const chipValues = chipList.value.map((x) => String(x.value));
          if (!chipValues.includes(String(selectedType.value))) {
            // removed (음식점 등) — 안전하게 전체로 초기화하되 keyword는 유지
            selectedType.value = "";
            const q = { ...route.query };
            delete q.content_type;
            router.replace({ query: q }).catch(() => {});
          }
        }
      } catch {
        contentTypes.value = [];
        chipList.value = [{ label: "전체", value: "" }];
      }
    }

    async function search() {
      loading.value = true;
      error.value = "";
      try {
        const res = await getPlaces({
          content_type: selectedType.value || "",
          keyword: keyword.value || "",
          limit: 100,
        });
        places.value = res.items || [];
        const q = {};
        if (selectedType.value) q.content_type = selectedType.value;
        if (keyword.value) q.keyword = keyword.value;
        router.replace({ query: q });
      } catch (e) {
        error.value = "장소를 불러오는 중 오류가 발생했습니다.";
        places.value = [];
      } finally {
        loading.value = false;
      }
    }

    function applyChip(ct) {
      selectedType.value = ct.value || "";
      search();
    }

    function isSelectedChip(ct) {
      return String(ct.value) === String(selectedType.value);
    }

    function openPlace(p) {
      router.push({ name: "PlaceDetail", params: { id: p.contentid } });
    }

    function emojiFor(name) {
      return emojiMap[name] || "📍";
    }

    onMounted(async () => {
      await loadContentTypes();
      await search();
    });

    return {
      contentTypes,
      places,
      loading,
      error,
      selectedType,
      keyword,
      chipList,
      applyChip,
      isSelectedChip,
      onFilterChange: applyChip,
      search,
      openPlace,
      emojiFor,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: var(--content-width);
  margin: 28px auto;
  padding: 0 20px;
}
.page-heading {
  margin-top: 8px;
  margin-bottom: 12px;
}
.h-page {
  margin: 0;
}
.caption {
  color: var(--muted);
  margin: 0;
}

/* chips */
.filters {
  margin: 8px 0 14px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  font-weight: 500;
}
.chip-active {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: white;
  border-color: transparent;
}

/* search panel: input + button aligned and same height */
.search-panel {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}
.search-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  font-size: 15px;
}
.search-btn {
  flex: 0 0 auto;
  height: 48px;
  padding: 0 18px;
  box-sizing: border-box;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* grid */
.places-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, 1fr);
}
.place-card-grid {
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease;
  cursor: pointer;
}
.place-card-grid:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-weak);
}

.place-thumb {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
  background: linear-gradient(180deg, #f6fbff, #ffffff);
}
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}
.placeholder-emoji {
  font-size: 28px;
}

.place-body {
  padding: 12px;
}
.place-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.place-info {
  max-width: 70%;
}
.addr {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.place-badge {
  text-align: right;
}

/* responsive */
@media (max-width: 1024px) {
  .places-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  .places-grid {
    grid-template-columns: 1fr;
  }
  .search-panel {
    flex-direction: column;
    align-items: stretch;
  }
  .search-btn {
    width: 100%;
    height: 48px;
  }
  .chip {
    flex: 0 0 auto;
  }
}
</style>