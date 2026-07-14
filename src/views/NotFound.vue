<template>
  <div>
    <AppHeader />
    <main class="container page">
      <BackButton :fallback="'/'" />
      <div class="notfound">
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>요청하신 페이지가 존재하지 않습니다.</p>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from "../components/AppHeader.vue";
import BackButton from "../components/BackButton.vue";
export default { components: { AppHeader, BackButton } };
</script>

<style scoped>
.container {
  max-width: 1126px;
  margin: 28px auto;
  padding: 0 20px;
  text-align: center;
}
.notfound {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}
</style>
