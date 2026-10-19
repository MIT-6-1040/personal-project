<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watchEffect } from "vue";
import { api } from "./api.ts";
import AddTopicPage from "./components/AddTopicPage.vue";
import FeedPage from "./components/FeedPage.vue";
import HistoryPage from "./components/HistoryPage.vue";
import InterestsPage from "./components/InterestsPage.vue";
import NavIcon from "./components/NavIcon.vue";
import SignIn from "./components/SignIn.vue";
import StoryCardSkeleton from "./components/StoryCardSkeleton.vue";
import StoryPage from "./components/StoryPage.vue";

type Page = "feed" | "history" | "story" | "interests" | "add-topic";
type Section = "feed" | "history" | "interests";

const links: { to: Section; label: string }[] = [
  { to: "feed", label: "Home" },
  { to: "history", label: "History" },
  { to: "interests", label: "Interests" },
];

const username = ref<string | null>(null);
const checking = ref(true);
const page = ref<Page>("feed");
const openStory = ref<string | null>(null);
// Where the open story came from, so Back returns there.
const storyFrom = ref<"feed" | "history">("feed");
// The phone menu. It's hidden by CSS on wider screens.
const menuOpen = ref(false);
// The small account dropdown under the avatar.
const profileOpen = ref(false);
const profile = useTemplateRef<HTMLElement>("profile");

// The nav link to underline. A story belongs to the list it was opened from.
const section = computed<Section>(() => {
  if (page.value === "story") return storyFrom.value;
  if (page.value === "add-topic") return "interests";
  return page.value;
});
const initial = computed(() => username.value?.charAt(0).toUpperCase() ?? "");

// The browser tab says which page you're on.
const titles: Record<Page, string> = {
  feed: "Your Feed",
  history: "History",
  story: "Story",
  interests: "Interests",
  "add-topic": "Search Topics",
};

watchEffect(() => {
  if (checking.value) document.title = "CatchUp";
  else if (!username.value) document.title = "Sign in · CatchUp";
  else document.title = `${titles[page.value]} · CatchUp`;
});

function go(next: Page) {
  page.value = next;
  menuOpen.value = false;
  profileOpen.value = false;
}

// Only one of the two menus is open at a time.
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  profileOpen.value = false;
}

function toggleProfile() {
  profileOpen.value = !profileOpen.value;
  menuOpen.value = false;
}

// Clicking anywhere outside the dropdown, or pressing Escape, closes it.
function closeProfileOnOutsideClick(event: PointerEvent) {
  if (profileOpen.value && !profile.value?.contains(event.target as Node)) profileOpen.value = false;
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  profileOpen.value = false;
  menuOpen.value = false;
}

// Shown on the sign-in form when a Commons sign-in didn't go through.
const signInNotice = ref("");

// Commons sends the browser back here with a one-time code, or with an error if the
// person cancelled. The code is removed from the address right away.
async function finishCommonsSignIn() {
  const params = new URLSearchParams(window.location.search);
  history.replaceState(null, "", "/");
  const code = params.get("code");
  const state = params.get("state");
  if (params.get("error") === "access_denied") {
    signInNotice.value = "Commons sign-in was cancelled.";
    return;
  }
  if (!code || !state) {
    signInNotice.value = "Commons sign-in didn't finish. Please try again.";
    return;
  }
  const result = await api.auth.commons.finish({ code, state });
  if ("error" in result) signInNotice.value = "Commons sign-in didn't finish. Please try again.";
  else username.value = result.username;
}

// If the browser still has a session cookie, we're already signed in.
onMounted(async () => {
  document.addEventListener("pointerdown", closeProfileOnOutsideClick);
  document.addEventListener("keydown", closeOnEscape);
  if (window.location.pathname === "/auth/commons/callback") {
    await finishCommonsSignIn();
  } else {
    const result = await api.auth.me({});
    if (!("error" in result)) username.value = result.username;
  }
  checking.value = false;
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeProfileOnOutsideClick);
  document.removeEventListener("keydown", closeOnEscape);
});

function showStory(story: string, from: "feed" | "history") {
  openStory.value = story;
  storyFrom.value = from;
  go("story");
}

async function signOut() {
  await api.auth["sign-out"]({});
  username.value = null;
  go("feed");
}
</script>

<template>
  <div class="app">
    <!-- While we check the session cookie, show the shape of the page. -->
    <header v-if="checking" class="topbar" aria-hidden="true">
      <div class="topbar-inner">
        <div class="skeleton skeleton-logo"></div>
        <div class="skeleton skeleton-avatar"></div>
      </div>
    </header>

    <header v-else-if="username" class="topbar">
      <div class="topbar-inner">
        <button
          class="icon-button menu-toggle"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="menuOpen"
          @click="toggleMenu"
        >
          <svg v-if="!menuOpen" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button class="logo" @click="go('feed')">Catch<span>Up</span></button>

        <nav class="main-nav">
          <button v-for="link in links" :key="link.to" :class="{ active: section === link.to }" @click="go(link.to)">
            <NavIcon :name="link.to" />
            <span>{{ link.label }}</span>
          </button>
        </nav>

        <div ref="profile" class="profile">
          <button class="avatar" aria-label="Account" :aria-expanded="profileOpen" @click="toggleProfile">
            {{ initial }}
          </button>
          <div v-if="profileOpen" class="profile-menu card">
            <p class="small muted">Signed in as</p>
            <p class="profile-name">{{ username }}</p>
            <button class="sign-out" @click="signOut">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <nav v-if="menuOpen" class="mobile-menu">
        <button v-for="link in links" :key="link.to" :class="{ active: section === link.to }" @click="go(link.to)">
          <NavIcon :name="link.to" />
          <span>{{ link.label }}</span>
        </button>
      </nav>
    </header>

    <main>
      <template v-if="checking">
        <div class="skeleton skeleton-page-title" aria-hidden="true"></div>
        <StoryCardSkeleton />
      </template>
      <SignIn v-else-if="!username" :notice="signInNotice" @signed-in="(name: string) => (username = name)" />
      <template v-else>
        <FeedPage v-if="page === 'feed'" @open="(story: string) => showStory(story, 'feed')" />
        <HistoryPage v-else-if="page === 'history'" @open="(story: string) => showStory(story, 'history')" />
        <StoryPage
          v-else-if="page === 'story' && openStory"
          :story="openStory"
          :from="storyFrom"
          @back="go(storyFrom)"
        />
        <InterestsPage v-else-if="page === 'interests'" @add="go('add-topic')" />
        <AddTopicPage v-else-if="page === 'add-topic'" @done="go('interests')" />
      </template>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <p>© {{ new Date().getFullYear() }} CatchUp. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
