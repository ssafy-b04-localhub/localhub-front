<template>
  <div>
    <AppHeader />
    <main
      class="container page"
      style="padding-top: 18px; padding-bottom: 32px">
      <BackButton :fallback="'/'" />

      <section style="margin-top: 8px; margin-bottom: 18px">
        <h1 class="h-page">부산의 장소를 찾아보세요</h1>
        <p class="caption" style="margin-top: 6px">
          관광지, 문화시설, 축제 등 원하는 부산 정보를 검색해 보세요.
        </p>
      </section>

      <section
        class="card"
        style="
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        ">
        <select
          v-model="selectedType"
          @change="onFilterChange"
          aria-label="카테고리 선택">
          <option value="">전체</option>
          <option
            v-for="ct in contentTypes"
            :key="ct.id"
            :value="String(ct.id)">
            {{ ct.name }}
          </option>
        </select>

        <input
          v-model="keyword"
          placeholder="검색어 입력 (예: 해운대, 박물관)"
          @keyup.enter="search"
          aria-label="검색어" />

        <button class="btn btn-primary" @click="search" type="button">
          검색
        </button>
      </section>

      <section style="margin-bottom: 14px">
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <button
            v-for="(ct, idx) in chipList"
            :key="idx"
            :class="[
              'btn-sm',
              selectedChipValue(ct) ? 'btn-primary' : 'btn-ghost',
            ]"
            @click="applyChip(ct)"
            style="border-radius: 999px">
            {{ ct.label }}
          </button>
        </div>
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
              <div
                v-else
                class="place-thumb"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                <div
                  style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    color: var(--muted);
                  ">
                  <div style="font-size: 28px">
                    {{ emojiFor(p.contentType) }}
                  </div>
                  <div class="caption">이미지 없음</div>
                </div>
              </div>

              <div class="place-body">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                  ">
                  <div style="display: flex; flex-direction: column">
                    <div class="card-title">{{ p.title }}</div>
                    <div
                      class="caption"
                      style="
                        margin-top: 6px;
                        max-height: 40px;
                        overflow: hidden;
                      ">
                      {{ p.addr1 || "" }}
                    </div>
                  </div>
                  <div style="text-align: right">
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
        contentTypes.value = res.content_types || [];
        chipList.value = [
          { label: "전체", value: "" },
          ...contentTypes.value.map((c) => ({
            label: c.name,
            value: String(c.id),
          })),
        ];
      } catch {
        contentTypes.value = [];
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

    function onFilterChange() {
      search();
    }

    function applyChip(ct) {
      selectedType.value = ct.value || "";
      search();
    }

    function selectedChipValue(ct) {
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
      onFilterChange,
      applyChip,
      selectedChipValue,
      openPlace,
      emojiFor,
    };
  },
};
</script>

<style scoped>
.card {
  display: flex;
  align-items: center;
}
.places-grid {
  margin-top: 8px;
}
.place-card-grid {
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
</style>
