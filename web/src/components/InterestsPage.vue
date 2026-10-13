<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage, type Interest } from "../api.ts";

defineEmits<{ add: [] }>();

const interests = ref<Interest[]>([]);
const error = ref("");

// Every change answers with the new list, so we just show whatever comes back.
function show(result: { interests: Interest[] } | { error: string }) {
  if ("error" in result) {
    error.value = errorMessage(result.error);
  } else {
    error.value = "";
    interests.value = result.interests;
  }
}

onMounted(async () => show(await api.interests.list({})));

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
    <div>
      <h1>My Interests</h1>
      <p class="muted">Choose the topics you want to see in your feed.</p>
    </div>
    <div class="actions">
      <button class="primary" @click="$emit('add')">+ Add Topic</button>
      <button @click="reset">Reset Interests</button>
    </div>
  </div>

  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="interests.length === 0" class="muted">
    No interests yet. Read some stories or add a topic.
  </p>

  <table v-else class="card">
    <thead>
      <tr><th>Topic</th><th>Count</th><th></th></tr>
    </thead>
    <tbody>
      <tr v-for="item in interests" :key="item.topic">
        <td>{{ item.topic }}</td>
        <td class="counter">
          <button :disabled="item.count === 0" @click="change(item.topic, item.count - 1)">−</button>
          <span>{{ item.count }}</span>
          <button @click="change(item.topic, item.count + 1)">+</button>
        </td>
        <td><button class="danger" title="Remove" @click="remove(item.topic)">Remove</button></td>
      </tr>
    </tbody>
  </table>
</template>
