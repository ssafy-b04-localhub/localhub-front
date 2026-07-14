<template>
  <header class="app-header">
    <div class="container">
      <router-link class="logo" to="/">LocalHub</router-link>

      <nav class="app-nav" aria-label="주요 내비게이션">
        <router-link
          to="/places"
          class="nav-item"
          :class="{ active: isActive('Places') }"
          >장소</router-link
        >
        <router-link
          to="/posts"
          class="nav-item"
          :class="{ active: isActive('PostsList') || isActive('PostDetail') }"
          >커뮤니티</router-link
        >
      </nav>
    </div>
  </header>
</template>

<script>
import { useRoute } from "vue-router";

export default {
  name: "AppHeader",
  setup() {
    const route = useRoute();

    function isActive(name) {
      try {
        return route.name === name;
      } catch {
        return false;
      }
    }

    return { isActive };
  },
};
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--border);
}
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}
.logo {
  font-weight: 700;
  color: var(--navy);
  font-size: 20px;
  text-decoration: none;
}
.app-nav {
  display: flex;
  gap: 18px;
  align-items: center;
}
.nav-item {
  color: var(--muted);
  padding: 8px 6px;
  border-radius: 8px;
  font-weight: 500;
}
.nav-item:hover {
  color: var(--primary);
}
.nav-item.active {
  color: var(--primary);
  font-weight: 600;
}
.nav-item.active::after {
  content: "";
  position: absolute;
}
</style>
