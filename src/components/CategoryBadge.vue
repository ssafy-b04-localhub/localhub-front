<template>
  <span class="category-badge" v-if="label" :aria-label="`카테고리: ${label}`">{{ label }}</span>
</template>

<script>
export default {
  name: "CategoryBadge",
  props: {
    label: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-soft, #eef4ff);
  color: var(--primary, #2563eb);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>