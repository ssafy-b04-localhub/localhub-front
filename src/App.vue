<template>
  <div id="app">
    <router-view />
    <ChatBotWidget />
  </div>
</template>

<script>
import ChatBotWidget from "./components/ChatBotWidget.vue";
export default {
  name: "App",
  components: { ChatBotWidget },
};
</script>

<style>
/* global small tweaks can be added in style.css */
</style>
