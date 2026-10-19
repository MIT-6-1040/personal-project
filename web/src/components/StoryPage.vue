<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage, timeAgo, type ExpandedStory } from "../api.ts";

const props = defineProps<{ story: string; from: "feed" | "history" }>();
defineEmits<{ back: [] }>();

const story = ref<ExpandedStory | null>(null);
const error = ref("");

// Opening the story is what records it as read.
onMounted(async () => {
  const result = await api.stories.read({ story: props.story });
  if ("error" in result) error.value = errorMessage(result.error, { NOT_FOUND: "This story no longer exists." });
  else story.value = result.story;
});
</script>

<template>
  <button class="link" @click="$emit('back')">← Back to {{ from === "history" ? "history" : "feed" }}</button>
  <p v-if="error" class="error">{{ error }}</p>

  <div v-else-if="!story" aria-busy="true">
    <span class="visually-hidden">Loading story</span>
    <div class="story-top" aria-hidden="true">
      <div class="skeleton skeleton-cover"></div>
      <div>
        <div class="skeleton skeleton-line" style="width: 6rem"></div>
        <div class="skeleton skeleton-heading"></div>
        <div class="skeleton skeleton-heading" style="width: 60%"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line" style="width: 80%"></div>
        <span class="skeleton skeleton-chip"></span>
        <span class="skeleton skeleton-chip"></span>
      </div>
    </div>
    <div class="sources" aria-hidden="true">
      <div v-for="n in 3" :key="n" class="card skeleton-source">
        <div class="skeleton skeleton-line" style="width: 5rem"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line" style="width: 4rem"></div>
      </div>
    </div>
  </div>

  <template v-else>
    <div class="story-top">
      <img v-if="story.image" :src="story.image" alt="" />
      <div v-else class="image-blank cover" aria-hidden="true"></div>
      <div>
        <p class="muted small">{{ timeAgo(story.publishedAt) }}</p>
        <h1>{{ story.headline }}</h1>
        <p>{{ story.summary }}</p>
        <h3>Topics</h3>
        <span v-for="topic in story.topics" :key="topic" class="chip">{{ topic }}</span>
      </div>
    </div>

    <h2>Original Sources</h2>
    <div class="sources">
      <a v-for="source in story.sources" :key="source.article" :href="source.url" target="_blank" rel="noopener" class="card">
        <strong>{{ source.source }}</strong>
        <span>{{ source.title }}</span>
        <span class="muted small">{{ timeAgo(source.publishedAt) }}</span>
      </a>
    </div>
  </template>
</template>
