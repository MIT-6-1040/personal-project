<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage, timeAgo, type ExpandedStory } from "../api.ts";

const props = defineProps<{ story: string }>();
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
  <button class="link" @click="$emit('back')">← Back to feed</button>
  <p v-if="error" class="error">{{ error }}</p>

  <template v-if="story">
    <div class="story-top">
      <img :src="story.image" alt="" />
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
