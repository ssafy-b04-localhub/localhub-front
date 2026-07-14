<template>
  <div class="chatbot">
    <button class="fab" @click="toggle" aria-label="chatbot">
      <span v-if="!open">💬</span>
      <span v-else>✕</span>
    </button>

    <div v-if="open" class="widget" :class="{ mobile: isMobile }">
      <header class="header">ChatBot</header>
      <div class="messages">
        <div v-for="(m,i) in messages" :key="i" class="msg">{{ m }}</div>
      </div>
      <div class="composer">
        <input v-model="input" @keyup.enter="send" placeholder="메시지 입력" />
        <button @click="send">보내기</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
export default {
  name: 'ChatBotWidget',
  setup() {
    const open = ref(false)
    const input = ref('')
    const messages = ref(['안녕하세요! 무엇을 도와드릴까요?'])
    const isMobile = computed(() => window.innerWidth <= 600)

    const toggle = () => { open.value = !open.value }

    const send = () => {
      if (!input.value) return
      messages.value.push(input.value)
      input.value = ''
      // TODO: 챗봇 백엔드 연동
    }

    onMounted(() => {
      window.addEventListener('resize', () => {})
    })

    return { open, input, messages, send, toggle, isMobile }
  }
}
</script>

<style scoped>
.chatbot { position:fixed; right:16px; bottom:16px; z-index:1000; }
.fab { width:56px; height:56px; border-radius:50%; background:#1976d2; color:#fff; border:none; font-size:20px; box-shadow:0 4px 12px rgba(0,0,0,.2); cursor:pointer; }
.widget { width:360px; height:480px; background:#fff; border:1px solid #ddd; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.15); display:flex; flex-direction:column; overflow:hidden; margin-bottom:8px; }
.header { padding:8px 12px; background:#1976d2; color:#fff; }
.messages { flex:1; padding:12px; overflow:auto; background:#f9f9f9; }
.composer { display:flex; gap:8px; padding:8px; border-top:1px solid #eee; }
.composer input { flex:1; padding:8px; }
.mobile { position:fixed; inset:0; margin:0; width:100%; height:100%; border-radius:0; }
@media (max-width:600px){
  .widget { width:100%; height:100%; right:0; bottom:0; border-radius:0; }
}
</style>