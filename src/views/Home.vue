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
            <button class="btn cta primary" @click="browsePlaces">
              <span class="cta-icon" aria-hidden="true">📍</span>
              <span class="cta-text">부산 장소 둘러보기</span>
            </button>

            <router-link to="/posts" class="btn cta secondary">
              <span class="cta-icon" aria-hidden="true">💬</span>
              <span class="cta-text">커뮤니티 보기</span>
            </router-link>
          </div>
        </div>

        <div class="hero-right">
          <div class="wave" aria-hidden="true">🌊</div>
        </div>
      </section>

      <section class="section" aria-labelledby="cat-heading">
        <div class="section-header">
          <h2 id="cat-heading" class="section-title">카테고리</h2>
          <div class="section-meta caption">
            스와이프하여 더 많은 카테고리를 확인하세요
          </div>
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

      <section class="section" aria-labelledby="recent-heading">
        <div class="section-header">
          <h2 id="recent-heading" class="section-title">최근 게시글</h2>
          <router-link to="/posts" class="section-link"
            >전체 보기 →</router-link
          >
        </div>

        <div class="posts-card card">
          <div class="posts-list">
            <div v-if="loadingPosts" class="state" style="padding: 18px">
              로딩 중...
            </div>
            <div
              v-else-if="posts.length === 0"
              class="state empty"
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
        posts.value = Array.isArray(ps)
          ? ps.sort((a, b) => Number(b.id) - Number(a.id))
          : [];
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
/* hero CTA: keep typography and sizing identical for primary and secondary */
.hero {
  margin: 28px auto;
  padding: 36px;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: center;
  background: linear-gradient(180deg, #f5fbff 0%, #ffffff 60%);
  box-shadow: var(--shadow-soft);
}
.hero-left {
  max-width: 640px;
}
.kicker {
  display: inline-block;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 8px;
}
.h-hero {
  margin: 0 0 12px;
}
.hero-leadin {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 15px;
}

/* CTA both use .cta with equal size/typography */
.cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
}
.cta .cta-icon {
  font-size: 18px;
  display: inline-block;
}
.cta .cta-text {
  display: inline-block;
}

.cta.primary {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: #fff;
  border: none;
}
.cta.secondary {
  background: transparent;
  color: var(--navy);
  border: 1px solid var(--border);
}

/* section header common */
.section {
  margin-top: 20px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--navy);
}
.section-link {
  color: var(--primary);
  font-weight: 600;
}

/* category scroll and posts list rely on global styles */
.cat-scroll {
  display: flex;
  gap: 14px;
  padding: 12px 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  align-items: stretch;
}
.cat-card {
  scroll-snap-align: start;
  flex: 0 0 200px;
  min-width: 190px;
  border-radius: 14px;
  border: 1px solid var(--border);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-weak);
}

/* posts card spacing already present; ensure consistent section heading usage */
.posts-card {
  margin-top: 6px;
  padding: 0;
  overflow: hidden;
}

/* responsive */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr 240px;
  }
}
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 14px;
  }
  .h-hero {
    font-size: 28px;
  }
}
</style>
