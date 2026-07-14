<template>
  <div class="page home">
    <AppHeader />
    <main class="container">
      <section class="hero">
        <div class="hero-left">
          <div class="kicker">부산 로컬 큐레이션</div>
          <h1 class="h-hero">부산의 새로운 장소를 발견해 보세요</h1>
          <p class="hero-leadin">
            관광지부터 문화시설, 축제, 맛집까지 부산의 다양한 이야기를
            만나보세요.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" @click="browsePlaces">
              부산 장소 둘러보기
            </button>
            <router-link to="/posts" class="btn btn-ghost"
              >커뮤니티 보기</router-link
            >
          </div>
        </div>

        <div class="hero-right">
          <div class="wave" aria-hidden="true">🌊</div>
        </div>
      </section>

      <section aria-labelledby="cat-heading" style="margin-top: 14px">
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
          ">
          <h2 id="cat-heading" class="h-section">카테고리</h2>
          <div class="caption">스와이프하여 더 많은 카테고리를 확인하세요</div>
        </div>

        <div
          class="cat-scroll"
          ref="scrollEl"
          @wheel.prevent="onWheel"
          @touchstart="onTouchStart">
          <div
            class="cat-card"
            v-for="c in contentTypes"
            :key="c.id"
            @click="goToPlaces(c)"
            role="button"
            tabindex="0"
            @keyup.enter="goToPlaces(c)">
            <div class="emoji">{{ emojiFor(c.name) }}</div>
            <div class="cat-title">{{ c.name }}</div>
            <div class="cat-desc">부산의 {{ c.name }} 정보를 확인하세요</div>
          </div>
        </div>
      </section>

      <section style="margin-top: 22px">
        <div class="posts-card card">
          <div class="posts-header">
            <div style="display: flex; gap: 12px; align-items: center">
              <div class="h-section">최근 게시글</div>
              <div class="caption">부산의 이야기를 함께 나눠보세요</div>
            </div>
            <router-link
              to="/posts"
              class="caption"
              style="color: var(--primary)"
              >전체 보기 →</router-link
            >
          </div>

          <div class="posts-list">
            <div v-if="loadingPosts" class="state" style="padding: 18px">
              로딩 중...
            </div>
            <div
              v-else-if="posts.length === 0"
              class="state"
              style="
                padding: 18px;
                display: flex;
                gap: 12px;
                align-items: center;
              ">
              <div style="font-size: 24px">📝</div>
              <div>게시글이 없습니다. 새로운 이야기를 시작해 보세요!</div>
            </div>
            <div v-else>
              <article
                v-for="p in posts.slice(0, 6)"
                :key="p.id"
                class="post-row"
                @click="goPost(p.id)">
                <div class="title">{{ p.title }}</div>
                <div class="meta">{{ formatDate(p.created_at) }}</div>
              </article>
            </div>
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
    const posts = ref([]);
    const loadingPosts = ref(false);
    const scrollEl = ref(null);
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
      router.push({ name: "Places", query: { content_type: c.id } });
    }

    function browsePlaces() {
      router.push({ name: "Places" });
    }

    function goPost(id) {
      router.push({ name: "PostDetail", params: { id } });
    }

    function formatDate(s) {
      return formatDateToKorean(s) || "";
    }

    function onWheel(e) {
      const el = scrollEl.value;
      if (!el) return;
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft += e.deltaY;
      }
    }
    function onTouchStart() {}

    onMounted(load);

    return {
      contentTypes,
      posts,
      loadingPosts,
      emojiFor,
      scrollEl,
      goToPlaces,
      goPost,
      browsePlaces,
      onWheel,
      onTouchStart,
      formatDate,
    };
  },
};
</script>

<style scoped>
/* scoped styles are intentionally minimal because main structure is in global CSS */
.hero {
}
.cat-scroll {
  padding-bottom: 8px;
}
.posts-card {
  overflow: hidden;
}
.post-row {
  transition: background-color 0.12s ease;
}
</style>
