<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage } from "../api.ts";

defineEmits<{ done: [] }>();

const topics = ref<string[]>([]);
const mine = ref<string[]>([]);
const search = ref("");
const error = ref("");
const added = ref("");

onMounted(async () => {
  const [known, interests] = await Promise.all([api.topics.list({}), api.interests.list({})]);
  if (!("error" in known)) topics.value = known.topics;
  if (!("error" in interests)) mine.value = interests.interests.map((i) => i.topic);
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
  <button class="link" @click="$emit('done')">← Back to My Interests</button>
  <h1>Search Topics</h1>
  <input v-model="search" class="search" placeholder="Search topics, like opt" autofocus />
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="added" class="success">{{ added }}</p>

  <ul class="topic-list">
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
