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
          ref="scrollEl"
          class="cat-scroll"
          @wheel.prevent="onWheel"
          @touchstart="onTouchStart"
        >
          <div
            v-for="c in contentTypes"
            :key="c.id"
            class="cat-card"
            role="button"
            tabindex="0"
            @click="goToPlaces(c)"
            @keyup.enter="goToPlaces(c)"
          >
            <div class="emoji">{{ emojiFor(c.name) }}</div>
            <div class="cat-title">{{ c.name }}</div>
            <div class="cat-desc">
              부산의 {{ c.name }} 정보를 확인하세요
            </div>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="recent-heading">
        <div class="section-header">
          <h2 id="recent-heading" class="section-title">최근 게시글</h2>

          <router-link to="/posts" class="section-link">
            전체 보기 →
          </router-link>
        </div>

        <div class="posts-card card">
          <div class="posts-list">
            <div
              v-if="loadingPosts"
              class="state"
              style="padding: 18px"
            >
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
              "
            >
              <div style="font-size: 24px">📝</div>

              <div>
                게시글이 없습니다. 새로운 이야기를 시작해 보세요!
              </div>
            </div>

            <div v-else>
              <article
                v-for="p in posts.slice(0, 6)"
                :key="p.id"
                class="post-row"
                @click="goPost(p.id)"
              >
                <div class="post-row-left">
                  <CategoryBadge
                    v-if="getCategoryLabel(p)"
                    :label="getCategoryLabel(p)"
                  />

                  <div class="recent-post-title">
                    {{ p.title }}
                  </div>
                </div>

                <div class="meta">
                  {{ formatDate(p.created_at) }}
                </div>
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
import { useRouter } from "vue-router";

import AppHeader from "../components/AppHeader.vue";
import CategoryBadge from "../components/CategoryBadge.vue";

import { getContentTypes } from "../api/content.js";
import { listPosts } from "../api/posts.js";
import formatDateToKorean from "../utils/formatDate.js";

export default {
  name: "Home",

  components: {
    AppHeader,
    CategoryBadge,
  },

  setup() {
    const contentTypes = ref([]);
    const allContentTypes = ref([]);
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
    };

    async function load() {
      try {
        const contentTypeResponse = await getContentTypes();

        allContentTypes.value =
          contentTypeResponse.content_types || [];

        contentTypes.value = allContentTypes.value.filter(
          (category) =>
            String(category?.name ?? "").trim() !== "음식점",
        );
      } catch {
        allContentTypes.value = [];
        contentTypes.value = [];
      }

      loadingPosts.value = true;

      try {
        const postResponse = await listPosts();

        posts.value = Array.isArray(postResponse)
          ? postResponse.sort(
              (a, b) => Number(b.id) - Number(a.id),
            )
          : [];
      } catch {
        posts.value = [];
      } finally {
        loadingPosts.value = false;
      }
    }

    function getCategoryLabel(post) {
      if (!post) {
        return null;
      }

      if (post.category_name) {
        return post.category_name;
      }

      if (post.category && post.category.name) {
        return post.category.name;
      }

      if (
        post.category_id !== undefined &&
        post.category_id !== null
      ) {
        const category = allContentTypes.value.find(
          (item) =>
            Number(item.id) === Number(post.category_id),
        );

        return category ? category.name : null;
      }

      return null;
    }

    function emojiFor(name) {
      return emojiMap[name] || "📍";
    }

    function goToPlaces(category) {
      router.push({
        name: "Places",
        query: {
          content_type: category.id,
        },
      });
    }

    function browsePlaces() {
      router.push({
        name: "Places",
      });
    }

    function goPost(id) {
      router.push({
        name: "PostDetail",
        params: {
          id,
        },
      });
    }

    function formatDate(value) {
      return formatDateToKorean(value) || "";
    }

    function onWheel(event) {
      const element = scrollEl.value;

      if (!element) {
        return;
      }

      if (element.scrollWidth > element.clientWidth) {
        element.scrollLeft += event.deltaY;
      }
    }

    function onTouchStart() {}

    onMounted(load);

    return {
      contentTypes,
      posts,
      loadingPosts,
      scrollEl,
      emojiFor,
      getCategoryLabel,
      goToPlaces,
      browsePlaces,
      goPost,
      formatDate,
      onWheel,
      onTouchStart,
    };
  },
};
</script>

<style scoped>
.hero {
  margin: 28px auto;
  padding: 36px;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: center;
  background: linear-gradient(
    180deg,
    #f5fbff 0%,
    #ffffff 60%
  );
  box-shadow: var(--shadow-soft);
}

.hero-left {
  max-width: 640px;
}

.kicker {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--primary);
  font-weight: 600;
}

.h-hero {
  margin: 0 0 12px;
}

.hero-leadin {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 15px;
}

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
  display: inline-block;
  font-size: 18px;
}

.cta .cta-text {
  display: inline-block;
}

.cta.primary {
  border: none;
  background: linear-gradient(
    90deg,
    var(--primary),
    var(--primary-hover)
  );
  color: #ffffff;
}

.cta.secondary {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--navy);
}

/* 공통 섹션 헤더 */
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
  margin: 0;
  color: var(--navy);
  font-size: 22px;
  font-weight: 700;
}

.section-link {
  flex-shrink: 0;
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.section-link:hover {
  color: var(--primary-hover);
}

/* 카테고리 */
.cat-scroll {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 12px 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

.cat-card {
  display: flex;
  flex: 0 0 200px;
  flex-direction: column;
  gap: 10px;
  min-width: 190px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  scroll-snap-align: start;
}

.cat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-weak);
}

/* 최근 게시글 */
.posts-card {
  margin-top: 6px;
  padding: 0;
  overflow: hidden;
}

.post-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(231, 235, 241, 0.8);
  cursor: pointer;
}

.post-row:last-child {
  border-bottom: none;
}

.post-row:hover {
  background: var(--primary-soft);
}

.post-row-left {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.recent-post-title {
  min-width: 0;
  overflow: hidden;
  color: var(--navy);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  flex-shrink: 0;
  margin-left: 12px;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr 240px;
  }
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 20px;
  }

  .h-hero {
    font-size: 28px;
  }

  .post-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .post-row-left {
    width: 100%;
  }

  .meta {
    align-self: flex-end;
    margin-left: 0;
  }
}
</style>