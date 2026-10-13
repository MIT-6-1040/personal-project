<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage, timeAgo, type FeedStory } from "../api.ts";

defineEmits<{ open: [story: string] }>();

const feed = ref<FeedStory[]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  const result = await api.feed({});
  loading.value = false;
  if ("error" in result) error.value = errorMessage(result.error);
  else feed.value = result.feed;
});
</script>

<template>
  <h1>Your Feed</h1>
  <p v-if="loading" class="muted">Loading your feed…</p>
  <p v-else-if="error" class="error">{{ error }}</p>
  <p v-else-if="feed.length === 0" class="muted">You're all caught up. There are no unread stories.</p>

  <article v-for="item in feed" :key="item.story" class="story-card card" @click="$emit('open', item.story)">
    <img :src="item.image" alt="" />
    <div>
      <p class="muted small">{{ timeAgo(item.publishedAt) }}</p>
      <h2>{{ item.headline }}</h2>
      <p class="summary">{{ item.summary }}</p>
      <span v-for="topic in item.topics" :key="topic" class="chip">{{ topic }}</span>
    </div>
  </article>
</template>
