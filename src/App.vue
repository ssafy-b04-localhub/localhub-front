<template>
  <div id="app">
    <router-view />
    <ChatBotWidget />
  </div>
</template>

<script>
import ChatBotWidget from './components/ChatBotWidget.vue'
export default {
  name: 'App',
  components: { ChatBotWidget }
}
</script>

<style>
/* 전역 스타일 필요 시 추가 */
</style>