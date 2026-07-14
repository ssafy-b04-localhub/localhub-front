<template>
  <article class="place-card" @click="go">
    <div class="thumb" v-if="place.firstimage2">
      <img :src="place.firstimage2" :alt="place.title" />
    </div>
    <div class="meta">
      <div class="title">{{ place.title }}</div>
      <div class="sub">
        <span class="type">{{ place.contentType }}</span>
        <span v-if="place.addr1" class="addr"> · {{ place.addr1 }}</span>
      </div>
    </div>
  </article>
</template>

<script>
import { useRouter } from "vue-router";
export default {
  name: "PlaceCard",
  props: {
    place: { type: Object, required: true },
  },
  setup(props) {
    const router = useRouter();
    function go() {
      router.push({
        name: "PlaceDetail",
        params: { id: props.place.contentid },
      });
    }
    return { go };
  },
};
</script>

<style scoped>
.place-card {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: var(--shadow);
  cursor: pointer;
  align-items: center;
  transition: transform 0.12s;
}
.place-card:hover {
  transform: translateY(-4px);
}
.thumb {
  width: 96px;
  height: 72px;
  flex: 0 0 96px;
  overflow: hidden;
  border-radius: 8px;
  background: #f4f4f6;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.meta {
  text-align: left;
}
.title {
  font-weight: 600;
  color: var(--text-h);
  margin-bottom: 6px;
}
.sub {
  color: var(--text);
  font-size: 14px;
}
.type {
  color: #0b63d6;
  font-weight: 600;
}
</style>
