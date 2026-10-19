<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { api, errorMessage, timeAgo, type ReadStory } from "../api.ts";
import { pageSize, useInfiniteScroll } from "../infinite.ts";
import StoryCardSkeleton from "./StoryCardSkeleton.vue";

defineEmits<{ open: [story: string] }>();

const history = ref<ReadStory[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(false);
const error = ref("");
const marker = useTemplateRef<HTMLElement>("marker");

// Loads the next ten stories after the ones already shown.
async function loadPage() {
  const result = await api.history({ offset: history.value.length });
  if ("error" in result) {
    error.value = errorMessage(result.error);
    hasMore.value = false;
    return;
  }
  const seen = new Set(history.value.map((item) => item.story));
  history.value.push(...result.history.filter((item) => !seen.has(item.story)));
  hasMore.value = result.history.length === pageSize;
}

onMounted(async () => {
  await loadPage();
  loading.value = false;
});

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  await loadPage();
  loadingMore.value = false;
}

useInfiniteScroll(marker, loadMore);
</script>

<template>
  <h1 class="page-title">History</h1>
  <StoryCardSkeleton v-if="loading" />
  <p v-else-if="history.length === 0 && error" class="error">{{ error }}</p>
  <p v-else-if="history.length === 0" class="muted">You haven't read any stories yet.</p>

  <article v-for="item in history" :key="item.story" class="story-card card" @click="$emit('open', item.story)">
    <img v-if="item.image" :src="item.image" alt="" />
    <div v-else class="image-blank" aria-hidden="true"></div>
    <div>
      <p class="muted small">{{ timeAgo(item.readAt) }}</p>
      <h2>{{ item.headline }}</h2>
      <p class="summary">{{ item.summary }}</p>
      <span v-for="topic in item.topics" :key="topic" class="chip">{{ topic }}</span>
    </div>
  </article>

  <StoryCardSkeleton v-if="loadingMore" :count="2" />
  <p v-if="history.length > 0 && error" class="error">{{ error }}</p>
  <div v-if="hasMore" ref="marker" class="scroll-marker" aria-hidden="true"></div>
</template>
