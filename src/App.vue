<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import LoginView from './views/LoginView.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';
import { store } from './store.js';
import { useToast } from 'vue-toastification';

const toast = useToast();

const sessionState = ref('loading');

async function checkSession() {
  try {
    const response = await fetch('/api/nodes');
    if (response.ok) {
      sessionState.value = 'loggedIn';
    } else {
      sessionState.value = 'loggedOut';
    }
  } catch (error) {
    sessionState.value = 'loggedOut';
  }
}

function handleLoginSuccess() {
  sessionState.value = 'loggedIn';
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
    
    <LoadingOverlay :show="store.isActionLoading" />
  </div>
</template>

<style scoped>
.app-container { min-height: 100vh; }
.loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.2rem; color: #888; }
</style>