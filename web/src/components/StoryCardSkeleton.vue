<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 3 });
</script>

<!-- Gray stand-ins shaped like story cards, shown while stories load. -->
<template>
  <div aria-busy="true">
    <span class="visually-hidden">Loading stories</span>
    <div v-for="n in count" :key="n" class="story-card card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-image"></div>
      <div>
        <div class="skeleton skeleton-line" style="width: 6rem"></div>
        <div class="skeleton skeleton-heading"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line" style="width: 70%"></div>
        <span class="skeleton skeleton-chip"></span>
        <span class="skeleton skeleton-chip"></span>
      </div>
    </div>
  </div>
</template>
