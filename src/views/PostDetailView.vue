<template>
  <div>
    <h1>{{ post.title }}</h1>
    <div class="content" v-html="post.content"></div>

    <div class="meta">
      <p><strong>작성일:</strong> {{ post.created_at || post.createdAt || '-' }}</p>
    </div>

    <div class="actions">
      <router-link :to="{ name: 'post-edit', params: { id: post.id } }"><button>수정</button></router-link>
      <button @click="showPwdModal = true">삭제</button>
    </div>

    <div v-if="showPwdModal" class="overlay">
      <div class="modal">
        <h3>비밀번호 확인</h3>
        <input v-model="password" type="password" placeholder="비밀번호" />
        <div class="modal-actions">
          <button @click="doDelete">확인</button>
          <button @click="showPwdModal = false">취소</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const MOCK_POSTS = [
  { id: '101', title: '목업 글: 지역 축제 안내', content: '<p>지역 축제에 대해 설명합니다.</p>', created_at: '2024-01-01' },
  { id: '102', title: '목업 글: 주민 참여 프로그램', content: '<p>참여 방법을 안내합니다.</p>', created_at: '2024-02-01' }
]

export default {
  name: 'PostDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const post = ref({ id: route.params.id, title: '', content: '' })
    const showPwdModal = ref(false)
    const password = ref('')
    const error = ref('')
    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const fetchPost = async () => {
      if (!API_BASE) {
        const m = MOCK_POSTS.find(p => String(p.id) === String(route.params.id))
        if (m) {
          post.value = m
          return
        }
        router.replace({ name: 'not-found' })
        return
      }

      try {
        const res = await fetch(`${API_BASE}/posts/${route.params.id}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        post.value = data || {}
      } catch (e) {
        const m = MOCK_POSTS.find(p => String(p.id) === String(route.params.id))
        if (m) {
          post.value = m
          return
        }
        router.replace({ name: 'not-found' })
      }
    }

    const doDelete = async () => {
      try {
        if (!API_BASE) {
          // mock: 이동 처리
          showPwdModal.value = false
          router.push({ name: 'post-list' })
          return
        }
        const res = await fetch(`${API_BASE}/posts/${post.value.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: password.value })
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          error.value = body.detail || '삭제 실패'
          return
        }
        showPwdModal.value = false
        router.push({ name: 'post-list' })
      } catch (e) {
        error.value = '네트워크 오류'
      }
    }

    onMounted(fetchPost)

    return { post, showPwdModal, password, doDelete, error }
  }
}
</script>

<style scoped>
.overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; }
.modal { background:#fff; padding:16px; border-radius:8px; width:320px; }
.modal-actions { margin-top:12px; display:flex; gap:8px; justify-content:flex-end; }
.error { color:red; margin-top:8px; }
.actions { margin-top:12px; display:flex; gap:8px; }
.meta { margin-top:8px; color:#666; }
.content { margin-top:8px; }
</style>