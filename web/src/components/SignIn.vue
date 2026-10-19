<script setup lang="ts">
import { ref } from "vue";
import { api, errorMessage } from "../api.ts";

// A message from an earlier step, such as a Commons sign-in that was cancelled.
const props = defineProps<{ notice?: string }>();
const emit = defineEmits<{ "signed-in": [username: string] }>();

const mode = ref<"sign-in" | "register">("sign-in");
const username = ref("");
const password = ref("");
const error = ref(props.notice ?? "");
const busy = ref(false);

// Commons asks the person to approve CatchUp, then sends them back to /auth/commons/callback.
async function continueWithCommons() {
  error.value = "";
  busy.value = true;
  const result = await api.auth.commons.start({});
  if ("error" in result) {
    busy.value = false;
    error.value = errorMessage(result.error, { UNAVAILABLE: "CatchUp can't reach Commons right now." });
    return;
  }
  window.location.assign(result.url);
}

async function submit() {
  error.value = "";
  // Check the obvious things here so the user hears about them right away.
  if (mode.value === "register" && !/^[A-Za-z0-9_-]{3,32}$/.test(username.value)) {
    error.value = "A username must have 3 to 32 letters, numbers, underscores, or hyphens.";
    return;
  }
  if (mode.value === "register" && password.value.length < 8) {
    error.value = "A password must have at least 8 characters.";
    return;
  }
  busy.value = true;
  const input = { username: username.value, password: password.value };
  const result =
    mode.value === "register" ? await api.auth.register(input) : await api.auth["sign-in"](input);
  busy.value = false;
  if ("error" in result) {
    error.value = errorMessage(result.error, {
      CONFLICT: "That username is already taken.",
      UNAUTHORIZED: "The username or password is incorrect.",
      INVALID_REQUEST: "Usernames need 3 to 32 letters or numbers, and passwords at least 8 characters.",
    });
    return;
  }
  emit("signed-in", result.username);
}
</script>

<template>
  <div class="sign-in card">
    <h1 class="logo">Catch<span>Up</span></h1>
    <p class="muted">Catch up on the news you care about.</p>

    <button type="button" class="commons-button" :disabled="busy" @click="continueWithCommons">
      {{ mode === "register" ? "Sign up with Commons" : "Sign in with Commons" }}
    </button>
    <p class="divider"><span>or</span></p>

    <form @submit.prevent="submit">
      <input v-model.trim="username" placeholder="Username" autocomplete="username" required />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
        required
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="primary" :disabled="busy">
        {{ mode === "register" ? "Create account" : "Sign in" }}
      </button>
    </form>
    <p class="switch-mode">
      {{ mode === "register" ? "Already have an account?" : "New here?" }}
      <button class="link" @click="(mode = mode === 'register' ? 'sign-in' : 'register'), (error = '')">
        {{ mode === "register" ? "Sign in" : "Create an account" }}
      </button>
    </p>
  </div>
</template>
