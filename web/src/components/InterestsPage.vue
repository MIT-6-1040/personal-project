<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { api, errorMessage, type Interest } from "../api.ts";
import { pageSize, useInfiniteScroll } from "../infinite.ts";

defineEmits<{ add: [] }>();

const interests = ref<Interest[]>([]);
const loading = ref(true);
const error = ref("");

// Every change answers with the whole list, re-sorted by count, so the list is loaded
// at once and only drawn ten more rows at a time as the user scrolls.
const showing = ref(pageSize);
const visible = computed(() => interests.value.slice(0, showing.value));
const hasMore = computed(() => showing.value < interests.value.length);
const marker = useTemplateRef<HTMLElement>("marker");

useInfiniteScroll(marker, async () => {
  showing.value += pageSize;
});

// Every change answers with the new list, so we just show whatever comes back.
function show(result: { interests: Interest[] } | { error: string }) {
  if ("error" in result) {
    error.value = errorMessage(result.error);
  } else {
    error.value = "";
    interests.value = result.interests;
  }
}

onMounted(async () => {
  show(await api.interests.list({}));
  loading.value = false;
});

async function change(topic: string, count: number) {
  if (count < 0) return;
  show(await api.interests["set-count"]({ topic, count }));
}

async function remove(topic: string) {
  show(await api.interests.remove({ topic }));
}

async function reset() {
  if (!confirm("Remove all of your interests?")) return;
  show(await api.interests.reset({}));
}
</script>

<template>
  <div class="page-head">
    <h1 class="page-title">Interests</h1>
    <div class="actions">
      <button class="primary" @click="$emit('add')">+ Add Topic</button>
      <button @click="reset">Reset Interests</button>
    </div>
  </div>

  <p v-if="error" class="error">{{ error }}</p>
  <table v-if="loading" class="card interests-table" aria-busy="true">
    <caption class="visually-hidden">Loading your interests</caption>
    <thead>
      <tr><th>Topic</th><th>Count</th><th></th></tr>
    </thead>
    <tbody aria-hidden="true">
      <tr v-for="n in 4" :key="n">
        <td><div class="skeleton skeleton-line" :style="{ width: `${12 - n * 1.5}rem` }"></div></td>
        <td><div class="skeleton skeleton-line" style="width: 5.5rem"></div></td>
        <td><div class="skeleton skeleton-line" style="width: 4rem"></div></td>
      </tr>
    </tbody>
  </table>

  <p v-else-if="interests.length === 0" class="muted">
    No interests yet. Read some stories or add a topic.
  </p>

  <table v-else class="card interests-table">
    <thead>
      <tr><th>Topic</th><th>Count</th><th><span class="visually-hidden">Remove</span></th></tr>
    </thead>
    <tbody>
      <tr v-for="item in visible" :key="item.topic">
        <td>{{ item.topic }}</td>
        <td class="counter">
          <button :disabled="item.count === 0" @click="change(item.topic, item.count - 1)">−</button>
          <span>{{ item.count }}</span>
          <button @click="change(item.topic, item.count + 1)">+</button>
        </td>
        <td class="remove-cell">
          <button class="danger icon-button" :aria-label="`Remove ${item.topic}`" title="Remove" @click="remove(item.topic)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="!loading && hasMore" ref="marker" class="scroll-marker" aria-hidden="true"></div>
</template>
