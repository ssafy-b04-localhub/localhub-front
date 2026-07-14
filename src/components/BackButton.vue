<template>
  <div class="back-wrapper">
    <button
      class="back-ghost"
      type="button"
      @click="goBack"
      aria-label="뒤로가기">
      <span class="icon" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </span>
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
.back-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: transparent;
  border: none;
  color: var(--navy);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.12s ease;
}
.back-ghost .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.06);
  color: var(--primary);
}
.back-ghost:hover {
  background: var(--primary-soft);
  transform: translateY(-2px);
}
.back-ghost:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.16);
  outline-offset: 2px;
}
.label {
  font-weight: 600;
}
</style>
