<template>
  <div>
    <h1>게시판</h1>

    <div class="controls">
      <input v-model="q" @keyup.enter="applySearch" placeholder="장소명 또는 주소 검색" />
      <button @click="applySearch">검색</button>
    </div>

    <table class="post-table">
      <thead><tr><th>ID</th><th>장소명</th><th>주소</th></tr></thead>
      <tbody>
        <tr v-for="place in places" :key="place.contentid">
          <td>{{ place.contentid }}</td>
          <td>
            <router-link :to="{ name: 'post-detail', params: { id: place.contentid } }">{{ place.title }}</router-link>
          </td>
          <td>{{ place.addr1 || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <span>총 {{ total }} 건 (한번에 {{ pageSize }}개 표시)</span>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PostListView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const places = ref([])
    const q = ref(route.query.search || '')
    const pageSize = 20
    const total = ref(0)
    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const fetchPosts = async () => {
      const params = new URLSearchParams()
      if (q.value) params.append('keyword', q.value)
      params.append('limit', String(pageSize))
      try {
        const res = await fetch(`${API_BASE}/api/places?${params.toString()}`)
        const data = await res.json()
        places.value = data.items || []
        total.value = data.total || (data.count || places.value.length)
      } catch (e) {
        places.value = []
        total.value = 0
      }
    }

    const applySearch = () => {
      router.replace({ name: 'post-list', query: { ...route.query, search: q.value || undefined } })
      fetchPosts()
    }

    watch(() => route.query, () => {
      q.value = route.query.search || ''
      fetchPosts()
    })

    onMounted(fetchPosts)

    return { places, q, applySearch, pageSize, total }
  }
}
</script>

<style scoped>
.controls { display:flex; gap:8px; margin-bottom:12px; align-items:center; }
.post-table { width:100%; border-collapse:collapse; }
.post-table th, .post-table td { border:1px solid #ddd; padding:8px; text-align:left; }
.pagination { margin-top:12px; }
</style>