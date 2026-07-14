<template>
  <div>
    <h1>{{ isEdit ? '장소 수정(미지원)' : '장소 등록(미지원)' }}</h1>
    <form @submit.prevent="submit">
      <div>
        <label>제목</label>
        <input v-model="title" required />
      </div>
      <div>
        <label>내용</label>
        <textarea v-model="content" rows="8" required></textarea>
      </div>
      <div v-if="false">
        <label>비밀번호 (수정/삭제용)</label>
        <input v-model="password" type="password" required />
      </div>
      <div class="form-actions">
        <button type="submit">등록</button>
        <button type="button" @click="cancel">취소</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="note">참고: 현재 백엔드 `LocalHub 부산 관광 API`는 읽기 전용입니다. 등록/수정/삭제 엔드포인트는 제공되지 않습니다.</p>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 홈/상세와 동일한 목업 데이터 (ID 일치 시 사용)
const MOCK_RECENT = [
  { id: '101', title: '목업 글: 지역 축제 안내', content: '<p>지역 축제에 대해 설명합니다.</p>' },
  { id: '102', title: '목업 글: 주민 참여 프로그램', content: '<p>참여 방법을 안내합니다.</p>' },
  { id: '103', title: '목업 글: 환경 정화 활동', content: '<p>일정과 장소 안내.</p>' }
]

export default {
  name: 'PostFormView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isEdit = !!route.params.id
    const title = ref('')
    const content = ref('')
    const password = ref('')
    const error = ref('')
    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const fetchPost = async () => {
      if (!isEdit) return
      if (!API_BASE) {
        const m = MOCK_RECENT.find(it => String(it.id) === String(route.params.id))
        if (m) {
          title.value = m.title
          content.value = m.content.replace(/<\/?p>/g, '') // 간단 포맷 정리
          return
        }
        router.replace({ name: 'not-found' })
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/places/${route.params.id}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        const item = data.item || data
        title.value = item.title || ''
        content.value = item.overview || item.subtitle || ''
      } catch (e) {
        // API 실패 시 목업 폴백
        const m = MOCK_RECENT.find(it => String(it.id) === String(route.params.id))
        if (m) {
          title.value = m.title
          content.value = m.content.replace(/<\/?p>/g, '')
          return
        }
        router.replace({ name: 'not-found' })
      }
    }

    const submit = async () => {
      // 현재 백엔드 API는 읽기 전용이므로 실제 등록/수정 호출은 하지 않습니다.
      if (API_BASE) {
        error.value = '백엔드가 등록/수정 엔드포인트를 제공하지 않습니다.'
        return
      }

      // 로컬 목업 동작: 기존 동작을 유지하여 데모 가능
      try {
        const payload = { title: title.value, content: content.value }
        if (isEdit) {
          const idx = MOCK_RECENT.findIndex(it => String(it.id) === String(route.params.id))
          if (idx >= 0) {
            MOCK_RECENT[idx] = { ...MOCK_RECENT[idx], title: payload.title, content: payload.content }
          }
          router.push({ name: 'post-detail', params: { id: route.params.id } })
        } else {
          const newId = String(Math.floor(Math.random() * 10000) + 200)
          MOCK_RECENT.unshift({ id: newId, title: payload.title, content: payload.content })
          router.push({ name: 'post-list' })
        }
      } catch (e) {
        error.value = '네트워크 오류'
      }
    }

    const cancel = () => {
      if (isEdit) router.push({ name: 'post-detail', params: { id: route.params.id } })
      else router.push({ name: 'post-list' })
    }

    onMounted(fetchPost)

    return { isEdit, title, content, password, submit, cancel, error }
  }
}
</script>

<style scoped>
.form-actions { margin-top:12px; display:flex; gap:8px; }
.error { color:red; margin-top:8px; }
</style>