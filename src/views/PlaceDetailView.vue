<template>
  <div>
    <h1>{{ place.title }}</h1>

    <div class="meta">
      <img v-if="place.firstimage" :src="place.firstimage" alt="" class="hero-img" />
      <p><strong>주소:</strong> {{ place.addr1 || '-' }}</p>
      <p v-if="place.addr2"><strong>상세:</strong> {{ place.addr2 }}</p>
      <p><strong>전화:</strong> {{ place.tel || '-' }}</p>
      <p v-if="place.overview"><strong>설명:</strong> <span v-html="place.overview"></span></p>
    </div>

    <div v-if="hasCoords" class="map">
      <iframe :src="mapSrc" style="width:100%;height:360px;border:0;border-radius:8px"></iframe>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PlaceDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const place = ref({ contentid: route.params.id, title: '' })
    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const fetchPlace = async () => {
      if (!API_BASE) {
        router.replace({ name: 'not-found' })
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/places/${route.params.id}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        place.value = data.item || data
      } catch (e) {
        router.replace({ name: 'not-found' })
      }
    }

    const lon = computed(() => parseFloat(place.value.mapx || place.value.mapX || 0))
    const lat = computed(() => parseFloat(place.value.mapy || place.value.mapY || 0))
    const hasCoords = computed(() => !Number.isNaN(lon.value) && !Number.isNaN(lat.value) && lon.value!==0 && lat.value!==0)

    const mapSrc = computed(() => {
      if (!hasCoords.value) return ''
      const delta = 0.01
      const left = lon.value - delta
      const right = lon.value + delta
      const bottom = lat.value - delta
      const top = lat.value + delta
      return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${lat.value},${lon.value}`
    })

    onMounted(fetchPlace)

    return { place, hasCoords, mapSrc }
  }
}
</script>

<style scoped>
.hero-img { max-width:100%; height:auto; border-radius:8px; margin-bottom:8px }
.meta p { margin:6px 0 }
.map { margin-top:12px }
</style>
