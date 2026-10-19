<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage } from "../api.ts";

defineEmits<{ done: [] }>();

const topics = ref<string[]>([]);
const mine = ref<string[]>([]);
const search = ref("");
const error = ref("");
const added = ref("");
const loading = ref(true);

onMounted(async () => {
  const [known, interests] = await Promise.all([api.topics.list({}), api.interests.list({})]);
  if (!("error" in known)) topics.value = known.topics;
  if (!("error" in interests)) mine.value = interests.interests.map((i) => i.topic);
  loading.value = false;
});

const matches = computed(() => {
  const text = search.value.trim().toLowerCase();
  return topics.value.filter((topic) => topic.toLowerCase().includes(text));
});

// A typed topic can be added even if no story has it yet.
const canAddTyped = computed(() => {
  const text = search.value.trim();
  return text !== "" && !topics.value.some((topic) => topic.toLowerCase() === text.toLowerCase());
});

async function add(topic: string) {
  error.value = "";
  added.value = "";
  const result = await api.interests.add({ topic, count: 1 });
  if ("error" in result) {
    error.value = errorMessage(result.error, {
      CONFLICT: `${topic} is already in your interests.`,
      INVALID_REQUEST: "A topic must have 1 to 100 characters.",
    });
    return;
  }
  mine.value = result.interests.map((i) => i.topic);
  added.value = `Added ${topic} to your interests.`;
}
</script>

<template>
  <button class="link" @click="$emit('done')">← Back to interests</button>
  <h1 class="page-title">Search Topics</h1>
  <div class="search">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input v-model="search" type="search" placeholder="Search topics, like opt" aria-label="Search topics" autofocus />
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="added" class="success">{{ added }}</p>

  <ul v-if="loading" class="topic-list" aria-busy="true">
    <li class="visually-hidden">Loading topics</li>
    <li v-for="n in 6" :key="n" aria-hidden="true">
      <div class="skeleton skeleton-line" :style="{ width: `${(n % 3) * 3 + 8}rem` }"></div>
      <div class="skeleton skeleton-line" style="width: 2rem"></div>
    </li>
  </ul>

  <ul v-else class="topic-list">
    <li v-if="canAddTyped">
      <span>Add "{{ search.trim() }}" as a new topic</span>
      <button @click="add(search.trim())">+</button>
    </li>
    <li v-for="topic in matches" :key="topic">
      <span>{{ topic }}</span>
      <span v-if="mine.includes(topic)" class="muted small">Added</span>
      <button v-else @click="add(topic)">+</button>
    </li>
  </ul>
</template>
