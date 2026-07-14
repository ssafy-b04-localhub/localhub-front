<template>
  <div class="page home">
    <AppHeader />
    <main class="container">
      <section class="hero-banner">
        <div class="hero-inner">
          <h1>지역 정보 공유 커뮤니티 LocalHub</h1>
          <p>부산의 관광지, 맛집, 축제·행사 정보를 한눈에 만나보세요</p>
        </div>
      </section>

      <section class="categories">
        <h2 class="sr-only">카테고리</h2>
        <div
          class="cat-scroll"
          ref="scrollEl"
          @wheel.prevent="onWheel"
          @touchstart="onTouchStart">
          <div
            v-for="c in contentTypes"
            :key="c.id"
            class="cat"
            @click="goToPlaces(c)"
            role="button"
            tabindex="0"
            @keyup.enter="goToPlaces(c)">
            <div class="emoji">{{ emojiFor(c.name) }}</div>
            <div class="name">{{ c.name }}</div>
            <div class="desc">부산의 {{ c.name }} 정보를 확인하세요</div>
          </div>
        </div>
      </section>

      <section class="recent-posts">
        <h2>최근 게시글</h2>
        <div class="post-list">
          <div v-if="loadingPosts">로딩 중...</div>
          <div v-else-if="posts.length === 0">게시글이 없습니다.</div>
          <div v-else>
            <article
              v-for="p in posts.slice(0, 4)"
              :key="p.id"
              class="post-item"
              @click="goPost(p.id)">
              <div class="left">
                <div class="title">{{ p.title }}</div>
                <div class="meta">{{ formatDate(p.created_at) }}</div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { getContentTypes } from "../api/content.js";
import { listPosts } from "../api/posts.js";
import { useRouter } from "vue-router";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "Home",
  components: { AppHeader },
  setup() {
    const contentTypes = ref([]);
    const router = useRouter();
    const posts = ref([]);
    const loadingPosts = ref(false);
    const scrollEl = ref(null);

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

    async function load() {
      try {
        const ct = await getContentTypes();
        contentTypes.value = ct.content_types || [];
      } catch {
        contentTypes.value = [];
      }

      loadingPosts.value = true;
      try {
        const ps = await listPosts();
        posts.value = ps.sort((a, b) => Number(b.id) - Number(a.id));
      } catch {
        posts.value = [];
      } finally {
        loadingPosts.value = false;
      }
    }

    function emojiFor(name) {
      return emojiMap[name] || "📍";
    }

    function goToPlaces(c) {
      // navigate to /places with content_type as id (backend accepts numeric id or name)
      router.push({ name: "Places", query: { content_type: c.id } });
    }

    function goPost(id) {
      router.push({ name: "PostDetail", params: { id } });
    }

    function formatDate(s) {
      return formatDateToKorean(s) || "";
    }

    // horizontal wheel handling (vertical wheel -> horizontal scroll)
    function onWheel(e) {
      const el = scrollEl.value;
      if (!el) return;
      // when content wider than container, translate vertical wheel to horizontal
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft += e.deltaY;
      }
    }

    // prevent browser default vertical swiping issues on touch by nothing special (native supports horizontal)
    function onTouchStart() {
      // placeholder for potential enhancements
    }

    onMounted(load);

    return {
      contentTypes,
      posts,
      goToPlaces,
      goPost,
      loadingPosts,
      emojiFor,
      scrollEl,
      onWheel,
      onTouchStart,
      formatDate,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 1126px;
  margin: 24px auto;
  padding: 0 20px;
}
.hero-banner {
  background: linear-gradient(180deg, #f4fbff, #ffffff);
  padding: 36px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 24px;
  text-align: left;
}
.hero-inner h1 {
  color: var(--accent);
  margin: 0 0 8px;
}

/* categories scroll area */
.cat-scroll {
  display: flex;
  gap: 14px;
  padding: 12px 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  align-items: stretch;
}
.cat {
  flex: 0 0 260px;
  scroll-snap-align: start;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}
.cat:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(11, 99, 214, 0.08);
}
.emoji {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f8ff;
  border-radius: 8px;
}
.name {
  font-weight: 600;
  color: var(--text-h);
}
.desc {
  color: var(--text);
  font-size: 13px;
  margin-top: auto;
}

/* hide scrollbar in a tasteful way but allow scrolling */
.cat-scroll::-webkit-scrollbar {
  height: 10px;
}
.cat-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

/* recent posts */
.post-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.post-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  background: white;
}
.post-item .title {
  font-weight: 600;
  color: var(--text-h);
}
.post-item .meta {
  color: var(--text);
  font-size: 13px;
  margin-top: 6px;
}

/* responsive */
@media (max-width: 768px) {
  .cat {
    flex: 0 0 68%;
    min-width: 220px;
  }
  .hero-inner {
    padding-bottom: 8px;
  }
}
</style>
