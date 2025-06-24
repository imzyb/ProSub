<script setup>
import { ref, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import LoginView from './views/LoginView.vue';
import { store } from './store.js';

const sessionState = ref('loading');

async function checkSession() {
  try {
    const response = await fetch('/api/nodes');
    sessionState.value = response.ok ? 'loggedIn' : 'loggedOut';
  } catch (error) {
    sessionState.value = 'loggedOut';
  }
}
function handleLoginSuccess() {
  window.location.reload();
}
onMounted(checkSession);
</script>

<template>
  <div class="app-container">
    <div v-if="sessionState === 'loading'" class="loading-screen">
      <p>正在连接服务器...</p>
    </div>
    <RouterView v-else-if="sessionState === 'loggedIn'" />
    <LoginView v-else :on-login-success="handleLoginSuccess" />
  </div>
</template>

<style scoped>
.loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; }
</style>