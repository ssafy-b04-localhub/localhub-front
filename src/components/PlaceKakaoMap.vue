<template>
  <div class="place-map-block">
    <div v-if="errorMsg" class="no-data">{{ errorMsg }}</div>
    <div v-else class="map-wrap">
      <div ref="mapContainer" class="kakao-map" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
const props = defineProps({ place: { type: Object, required: true } });

const errorMsg = ref("");
const mapContainer = ref(null);
const mapInstance = ref(null);
const lat = ref(NaN);
const lng = ref(NaN);
const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "";

const hasCoords = computed(() => Number.isFinite(lat.value) && Number.isFinite(lng.value));

// 로드: autoload=false로 삽입한 뒤 kakao.maps.load로 초기화
function loadKakaoSdk(appKey, timeout = 7000) {
  return new Promise((resolve, reject) => {
    try {
      if (window.kakao && window.kakao.maps && typeof window.kakao.maps.LatLng === "function") {
        return resolve(window.kakao);
      }

      const id = "kakao-map-sdk";
      const src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        script.onerror = () => reject(new Error("kakao sdk load failed"));
        document.head.appendChild(script);
      }

      const start = Date.now();
      (function waitForKakao() {
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === "function") {
          // 요청한 모듈 초기화 — load 콜백에서 실제 클래스들이 준비됨
          try {
            window.kakao.maps.load(() => {
              if (typeof window.kakao.maps.LatLng === "function") resolve(window.kakao);
              else reject(new Error("kakao.maps.load completed but LatLng missing"));
            });
            return;
          } catch (e) {
            // 계속 대기/재시도
          }
        }
        if (Date.now() - start > timeout) {
          return reject(new Error("kakao maps initialization timeout"));
        }
        setTimeout(waitForKakao, 100);
      })();
    } catch (e) {
      reject(e);
    }
  });
}

function createMap(kakao, lat0, lng0) {
  if (!mapContainer.value) return;
  mapContainer.value.innerHTML = "";
  const options = { center: new kakao.maps.LatLng(lat0, lng0), level: 4 };
  mapInstance.value = new kakao.maps.Map(mapContainer.value, options);
  const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat0, lng0) });
  marker.setMap(mapInstance.value);
  const iw = new kakao.maps.InfoWindow({ content: `<div style="padding:6px;">${props.place?.title ?? "장소"}</div>` });
  kakao.maps.event.addListener(marker, "click", () => iw.open(mapInstance.value, marker));
  // 강제 리사이즈 + 센터 재설정
  setTimeout(() => {
    try {
      kakao.maps.event.trigger(mapInstance.value, "resize");
      mapInstance.value.setCenter(new kakao.maps.LatLng(lat0, lng0));
    } catch (e) {}
  }, 200);
}

async function renderMap() {
  errorMsg.value = "";
  const item = props.place;
  if (!item) {
    errorMsg.value = "장소 정보가 없습니다.";
    return;
  }

  try {
    const pLat = parseFloat(item.mapy ?? item.mapY ?? "");
    const pLng = parseFloat(item.mapx ?? item.mapX ?? "");
    if (Number.isFinite(pLat) && Number.isFinite(pLng)) {
      lat.value = pLat;
      lng.value = pLng;
    }

    if (!KAKAO_KEY) {
      errorMsg.value = "카카오 JS 키가 설정되어 있지 않습니다.";
      return;
    }

    const kakao = await loadKakaoSdk(KAKAO_KEY);

    const runCreate = (latv, lngv) => {
      if (kakao && kakao.maps && typeof kakao.maps.LatLng === "function") {
        createMap(kakao, latv, lngv);
      } else {
        errorMsg.value = "지도 API 초기화 실패";
      }
    };

    if (hasCoords.value) {
      runCreate(lat.value, lng.value);
      return;
    }

    if (item.addr1) {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(item.addr1, (result, status) => {
        try {
          if (status === kakao.maps.services.Status.OK && result && result[0]) {
            const y = parseFloat(result[0].y);
            const x = parseFloat(result[0].x);
            lat.value = y;
            lng.value = x;
            runCreate(lat.value, lng.value);
          } else {
            errorMsg.value = "주소로 좌표를 찾을 수 없습니다.";
          }
        } catch (e) {
          console.error(e);
          errorMsg.value = "지도를 초기화하는 중 오류가 발생했습니다.";
        }
      });
    } else {
      errorMsg.value = "좌표 및 주소 정보가 없습니다.";
    }
  } catch (e) {
    console.error(e);
    errorMsg.value = `지도 로드 중 오류: ${e.message || e}`;
  }
}

onMounted(renderMap);
watch(() => props.place, renderMap, { deep: true });
</script>

<style scoped>
.place-map-block { margin-top: 8px; }
.kakao-map { width: 100%; height: 300px; border-radius: 8px; background:#f6f8fa; }
.no-data { padding:1rem; color:#666; text-align:center; }
</style>