<script setup>
import { ref, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import LoginView from './views/LoginView.vue';

// 会话状态: loading (检查中), loggedIn (已登录), loggedOut (未登录)
const sessionState = ref('loading');

// 检查当前会话是否有效
async function checkSession() {
  try {
    // 尝试请求一个受保护的API
    const response = await fetch('/api/nodes'); 
    if (response.ok) {
      // 如果成功 (200 OK)，说明已登录
      sessionState.value = 'loggedIn';
    } else {
      // 如果失败 (401 Unauthorized)，说明未登录
      sessionState.value = 'loggedOut';
    }
  } catch (error) {
    console.error("Session check failed:", error);
    sessionState.value = 'loggedOut';
  }
}

// 定义一个函数，在登录成功后由子组件调用
function handleLoginSuccess() {
  sessionState.value = 'loggedIn';
}

// 组件加载时，立即检查会话状态
onMounted(() => {
  checkSession();
});
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
.app-container {
  min-height: 100vh;
  background-color: #f0f2f5;
}
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #888;
}
</style>