<template>
  <div>
    <h1>부산 지역정보</h1>

    <div class="tabs">
      <button v-for="ct in contentTypes" :key="ct.id" @click="selectType(ct.id)" :class="{active: ct.id===selectedType}">
        {{ ct.name }}
      </button>
    </div>

    <div class="controls">
      <input v-model="q" @keyup.enter="applySearch" placeholder="장소명 또는 주소 검색" />
      <button @click="applySearch">검색</button>
    </div>

    <div class="cards">
      <div class="card" v-for="place in places" :key="place.contentid">
        <img v-if="place.firstimage" :src="place.firstimage" alt="" />
        <div class="card-body">
          <h3>
            <router-link :to="{ name: 'place-detail', params: { id: place.contentid } }">{{ place.title }}</router-link>
          </h3>
          <p>{{ place.addr1 || '-' }}</p>
        </div>
      </div>
    </div>

    <div class="footer-note">총 {{ total }} 건</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PlacesListView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const contentTypes = ref([])
    const selectedType = ref(route.query.content_type || '')
    const q = ref(route.query.keyword || '')
    const places = ref([])
    const total = ref(0)
    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const loadContentTypes = async () => {
      if (!API_BASE) return
      try {
        const res = await fetch(`${API_BASE}/api/content-types`)
        const data = await res.json()
        contentTypes.value = data.content_types || []
      } catch (e) {
        contentTypes.value = []
      }
    }

    const fetchPlaces = async () => {
      const params = new URLSearchParams()
      if (selectedType.value) params.append('content_type', selectedType.value)
      if (q.value) params.append('keyword', q.value)
      params.append('limit', '50')
      try {
        const res = await fetch(`${API_BASE}/api/places?${params.toString()}`)
        const data = await res.json()
        places.value = data.items || []
        total.value = data.total || data.count || places.value.length
      } catch (e) {
        places.value = []
        total.value = 0
      }
    }

    const selectType = (id) => {
      selectedType.value = id
      router.replace({ name: 'places-list', query: { ...route.query, content_type: id } })
      fetchPlaces()
    }

    const applySearch = () => {
      router.replace({ name: 'places-list', query: { ...route.query, keyword: q.value || undefined } })
      fetchPlaces()
    }

    onMounted(async () => {
      await loadContentTypes()
      fetchPlaces()
    })

    return { contentTypes, selectedType, q, places, total, selectType, applySearch }
  }
}
</script>

<style scoped>
.tabs { display:flex; gap:8px; margin:12px 0; }
.tabs button { padding:8px 12px; border-radius:6px; border:1px solid #ddd; background:#fff; cursor:pointer }
.tabs .active { background:#1976d2; color:#fff; border-color:#1976d2 }
.controls { display:flex; gap:8px; margin-bottom:12px }
.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px }
.card { border:1px solid #eee; border-radius:8px; overflow:hidden; background:#fff }
.card img { width:100%; height:140px; object-fit:cover }
.card-body { padding:8px }
.footer-note { margin-top:12px; color:#666 }
</style>
