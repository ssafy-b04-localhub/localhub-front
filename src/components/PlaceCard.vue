<template>
  <article class="place-card-grid" @click="go" role="button">
    <img
      v-if="place.firstimage2 || place.firstimage"
      class="place-thumb"
      :src="place.firstimage2 || place.firstimage"
      :alt="place.title" />
    <div
      v-else
      class="place-thumb"
      style="display: flex; align-items: center; justify-content: center">
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--muted);
        ">
        <div style="font-size: 28px">{{ emojiFor(place.contentType) }}</div>
        <div class="caption">이미지 없음</div>
      </div>
    </div>

    <div class="place-body">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
        <div>
          <div class="card-title">{{ place.title }}</div>
          <div
            class="caption"
            style="
              margin-top: 6px;
              max-width: 60ch;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">
            {{ place.addr1 || "" }}
          </div>
        </div>
        <div style="text-align: right">
          <div class="badge">{{ place.contentType || "" }}</div>
        </div>
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
    const emojiMap = {
      관광지: "🏖️",
      문화시설: "🏛️",
      축제공연행사: "🎆",
      여행코스: "🗺️",
      레포츠: "🏄",
      숙박: "🏨",
      쇼핑: "🛍️",
      음식점: "🍽️",
    };
    function go() {
      router.push({
        name: "PlaceDetail",
        params: { id: props.place.contentid },
      });
    }
    function emojiFor(name) {
      return emojiMap[name] || "📍";
    }
    return { go, emojiFor };
  },
};
</script>

<style scoped>
.place-card-grid {
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}
.place-card-grid:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-weak);
}
.place-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: linear-gradient(180deg, #f6fbff, #ffffff);
}
.place-body {
  padding: 12px;
}
.card-title {
  font-weight: 600;
  color: var(--navy);
}
.badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
  font-size: 13px;
}
</style>
