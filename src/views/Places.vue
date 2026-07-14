<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/'" />

      <div class="controls">
        <select v-model="selectedType" @change="onFilterChange">
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
          placeholder="검색어 입력"
          @keyup.enter="search" />
        <button @click="search">검색</button>
      </div>

      <div v-if="loading" class="state">로딩 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else>
        <div v-if="places.length === 0" class="state">결과가 없습니다.</div>
        <div class="list">
          <PlaceCard v-for="p in places" :key="p.contentid" :place="p" />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
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

    // Use id for content_type (backend accepts numeric id or name)
    const selectedType = ref(
      route.query.content_type ? String(route.query.content_type) : "",
    );
    const keyword = ref(route.query.keyword || "");

    async function loadContentTypes() {
      try {
        const res = await getContentTypes();
        contentTypes.value = res.content_types || [];
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
        // update query with current filters (keep order)
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
      // immediate search on change
      search();
    }

    onMounted(async () => {
      await loadContentTypes();
      // ensure initial selectedType matches available ids (no guessing)
      if (selectedType.value) {
        // keep as-is; backend will handle invalid id by returning empty
      }
      await search();
    });

    // react to external query changes (e.g., user directly edits URL)
    watch(
      () => route.query,
      (q) => {
        const ct = q.content_type ? String(q.content_type) : "";
        if (ct !== selectedType.value) {
          selectedType.value = ct;
          search();
        }
        const kw = q.keyword || "";
        if (kw !== keyword.value) {
          keyword.value = kw;
        }
      },
    );

    return {
      contentTypes,
      places,
      loading,
      error,
      selectedType,
      keyword,
      search,
      onFilterChange,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 1126px;
  margin: 28px auto;
  padding: 0 20px;
}
.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  align-items: center;
}
.controls select,
.controls input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.controls button {
  background: #0b63d6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.state {
  color: var(--text);
  padding: 12px;
}
.state.error {
  color: #d9534f;
}
</style>
