<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "./api.ts";
import AddTopicPage from "./components/AddTopicPage.vue";
import FeedPage from "./components/FeedPage.vue";
import InterestsPage from "./components/InterestsPage.vue";
import SignIn from "./components/SignIn.vue";
import StoryPage from "./components/StoryPage.vue";

type Page = "feed" | "story" | "interests" | "add-topic";

const username = ref<string | null>(null);
const checking = ref(true);
const page = ref<Page>("feed");
const openStory = ref<string | null>(null);

// If the browser still has a session cookie, we're already signed in.
onMounted(async () => {
  const result = await api.auth.me({});
  if (!("error" in result)) username.value = result.username;
  checking.value = false;
});

function showStory(story: string) {
  openStory.value = story;
  page.value = "story";
}

async function signOut() {
  await api.auth["sign-out"]({});
  username.value = null;
  page.value = "feed";
}
</script>

<template>
  <p v-if="checking" class="center muted">Loading…</p>

  <SignIn v-else-if="!username" @signed-in="(name: string) => (username = name)" />

  <template v-else>
    <header class="topbar">
      <button class="logo" @click="page = 'feed'">Catch<span>Up</span></button>
      <nav>
        <button :class="{ active: page === 'feed' || page === 'story' }" @click="page = 'feed'">Home</button>
        <button :class="{ active: page === 'interests' || page === 'add-topic' }" @click="page = 'interests'">
          My Interests
        </button>
        <button class="muted" @click="signOut">Sign out ({{ username }})</button>
      </nav>
    </header>

    <main>
      <FeedPage v-if="page === 'feed'" @open="showStory" />
      <StoryPage v-else-if="page === 'story' && openStory" :story="openStory" @back="page = 'feed'" />
      <InterestsPage v-else-if="page === 'interests'" @add="page = 'add-topic'" />
      <AddTopicPage v-else-if="page === 'add-topic'" @done="page = 'interests'" />
    </main>
  </template>
</template>
