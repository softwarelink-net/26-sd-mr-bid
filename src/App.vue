<script setup>
import { RouterView } from 'vue-router'
import StickyTopBanner from '@/components/common/StickyTopBanner.vue'
</script>

<template>
  <StickyTopBanner />
  <div class="min-h-screen" style="padding-top: 40px">
    <RouterView />
  </div>
</template>
