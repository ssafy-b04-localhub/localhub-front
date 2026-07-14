<template>
  <div class="back-wrapper">
    <button @click="goBack" class="back-btn" type="button">
      <span class="arrow">◀</span>
      <span class="label">{{ label }}</span>
    </button>
  </div>
</template>

<script>
import { useRouter } from "vue-router";

export default {
  name: "BackButton",
  props: {
    fallback: { type: String, default: "/" },
    label: { type: String, default: "뒤로가기" },
  },
  setup(props) {
    const router = useRouter();

    function goBack() {
      // Try history.back(); if no history, route to fallback
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push(props.fallback);
    }

    return { goBack };
  },
};
</script>

<style scoped>
.back-wrapper {
  margin: 12px 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
  color: var(--text-h);
  font-weight: 500;
}
.back-btn .arrow {
  font-size: 14px;
}
.back-btn:hover {
  background: var(--accent-bg);
  box-shadow: var(--shadow);
}
.back-btn:focus-visible {
  outline: 3px solid rgba(11, 99, 214, 0.18);
  outline-offset: 2px;
}
</style>
