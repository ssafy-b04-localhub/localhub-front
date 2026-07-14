<template>
  <header class="app-header">
    <div class="container">
      <router-link to="/" class="logo">LocalHub</router-link>
      <div class="header-actions">
        <router-link to="/places" class="link">장소</router-link>
        <router-link to="/posts" class="link">게시판</router-link>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: "AppHeader",
};
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--border);
  background: white;
  position: sticky;
  top: 0;
  z-index: 40;
}

.container {
  max-width: 1126px;
  margin: 0 auto;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-weight: 700;
  color: #0b63d6;
  font-size: 22px;
  text-decoration: none;
}

.header-actions .link {
  margin-left: 16px;
  color: var(--text);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
}
.header-actions .link:hover {
  background: var(--accent-bg);
}
</style>
