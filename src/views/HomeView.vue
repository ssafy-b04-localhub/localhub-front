<template>
  <div class="home">
    <section class="hero">
      <h1>선정 권역 소개</h1>
      <p>간단한 소개 배너 영역입니다.</p>
    </section>

    <section class="categories">
      <h2>카테고리</h2>
      <div class="cats">
        <button v-for="ct in contentTypes" :key="ct.id" @click="goCategory(ct.id)">{{ ct.name }}</button>
      </div>
    </section>

    <section class="recent-posts">
      <h2>추천 장소</h2>
      <ul>
        <li v-for="place in recent" :key="place.contentid">
          <router-link :to="{ name: 'place-detail', params: { id: place.contentid } }">{{ place.title }}</router-link>
        </li>
      </ul>

      <div class="view-all">
        <router-link :to="{ name: 'places-list' }">
          <button class="view-all-btn">장소 전체 보기</button>
        </router-link>
      </div>
    </section>

    <ChatBotWidget />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import ChatBotWidget from '../components/ChatBotWidget.vue'
import { useRouter } from 'vue-router'

// 로컬 목업 데이터 (API가 없을 때 사용)
const MOCK_RECENT = [
  { contentid: '101', title: '목업 장소: 지역 축제 안내', addr1: '', tel: '', firstimage: '', mapx: '', mapy: '' },
  { contentid: '102', title: '목업 장소: 주민 참여 프로그램', addr1: '', tel: '', firstimage: '', mapx: '', mapy: '' },
  { contentid: '103', title: '목업 장소: 환경 정화 활동', addr1: '', tel: '', firstimage: '', mapx: '', mapy: '' }
]

export default {
  name: 'HomeView',
  components: { ChatBotWidget },
  setup() {
    const recent = ref([])
    const API_BASE = import.meta.env.VITE_API_BASE || ''
    const contentTypes = ref([])
    const router = useRouter()

    const fetchContentTypes = async () => {
      if (!API_BASE) return
      try {
        const res = await fetch(`${API_BASE}/api/content-types`)
        const data = await res.json()
        contentTypes.value = data.content_types || []
      } catch (e) {
        contentTypes.value = []
      }
    }

    const fetchRecent = async () => {
      if (!API_BASE) {
        recent.value = MOCK_RECENT
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/places?limit=5`)
        const data = await res.json()
        recent.value = data.items || []
      } catch (e) {
        recent.value = MOCK_RECENT
      }
    }

    const goCategory = (id) => {
      router.push({ name: 'places-list', query: { content_type: id } })
    }

    onMounted(async () => { await fetchContentTypes(); fetchRecent() })
    return { recent, contentTypes, goCategory }
  }
}
</script>

<style scoped>
.hero { padding:20px; background:#eef; border-radius:8px; margin-bottom:16px; }
.recent-posts ul { padding-left: 1rem; }
.view-all { margin-top:12px; }
.view-all-btn { padding:8px 12px; background:#1976d2; color:#fff; border:none; border-radius:6px; cursor:pointer; }
</style>