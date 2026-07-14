<template>
  <div>
    <h2>페이지를 찾을 수 없습니다 (404)</h2>
    <router-link :to="{ name: 'home' }">홈으로 이동</router-link>
  </div>
</template>
<script>
export default { name: 'NotFoundView' }
</script>