<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { api, errorMessage, timeAgo, type FeedStory } from "../api.ts";
import { pageSize } from "../infinite.ts";
import StoryCardSkeleton from "./StoryCardSkeleton.vue";

defineEmits<{ open: [story: string] }>();

const feed = ref<FeedStory[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(false);
const error = ref("");
const search = ref("");
const sources = ref<string[]>([]);
// The outlet to show stories from, or "" for every outlet.
const source = ref("");

// Each new search or filter ranks the feed again on the backend. Answers to
// older requests are dropped, so a slow one can't replace a newer list.
let latest = 0;

// Ranks the stories that match the search and source, across every story, and
// shows the first ten.
async function rank() {
  const request = ++latest;
  loading.value = true;
  error.value = "";
  const result = await api.feed({ search: search.value.trim(), source: source.value });
  if (request !== latest) return;
  loading.value = false;
  if ("error" in result) {
    feed.value = [];
    hasMore.value = false;
    error.value = errorMessage(result.error);
    return;
  }
  feed.value = result.feed;
  hasMore.value = result.feed.length === pageSize;
}

onMounted(async () => {
  void rank();
  const result = await api["/feed/sources"]({});
  if (!("error" in result)) sources.value = result.sources;
});

// Waits for a pause in typing, so the feed isn't ranked on every key.
let typing: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(typing);
  typing = setTimeout(rank, 300);
});

function pickSource(name: string) {
  if (source.value === name) return;
  source.value = name;
  void rank();
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  const request = latest;
  loadingMore.value = true;
  const result = await api["/feed/more"]({ offset: feed.value.length });
  loadingMore.value = false;
  if (request !== latest) return;
  if ("error" in result) {
    error.value = errorMessage(result.error);
    hasMore.value = false;
    return;
  }
  const seen = new Set(feed.value.map((item) => item.story));
  feed.value.push(...result.feed.filter((item) => !seen.has(item.story)));
  hasMore.value = result.feed.length === pageSize;
}
</script>

<template>
  <div class="search">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input v-model="search" type="search" placeholder="Search all stories" aria-label="Search all stories" />
  </div>

  <div v-if="sources.length > 0" class="source-filters" role="group" aria-label="Filter by source">
    <button :class="{ active: source === '' }" :aria-pressed="source === ''" @click="pickSource('')">All</button>
    <button
      v-for="name in sources"
      :key="name"
      :class="{ active: source === name }"
      :aria-pressed="source === name"
      @click="pickSource(name)"
    >
      {{ name }}
    </button>
  </div>

  <StoryCardSkeleton v-if="loading" />
  <template v-else>
    <p v-if="feed.length === 0 && error" class="error">{{ error }}</p>
    <p v-else-if="feed.length === 0 && (search.trim() || source)" class="muted">
      No unread stories match<template v-if="search.trim()"> "{{ search.trim() }}"</template
      ><template v-if="source"> from {{ source }}</template>.
    </p>
    <p v-else-if="feed.length === 0" class="muted">You're all caught up. There are no unread stories.</p>

    <article v-for="item in feed" :key="item.story" class="story-card card" @click="$emit('open', item.story)">
      <img v-if="item.image" :src="item.image" alt="" />
      <div v-else class="image-blank" aria-hidden="true"></div>
      <div>
        <p class="muted small">{{ timeAgo(item.publishedAt) }}</p>
        <h2>{{ item.headline }}</h2>
        <p class="summary">{{ item.summary }}</p>
        <span v-for="topic in item.topics" :key="topic" class="chip">{{ topic }}</span>
      </div>
    </article>

    <StoryCardSkeleton v-if="loadingMore" :count="2" />
    <p v-if="feed.length > 0 && error" class="error">{{ error }}</p>
    <div v-if="hasMore && !loadingMore" class="load-more">
      <button @click="loadMore">Show more</button>
    </div>
  </template>
</template>
