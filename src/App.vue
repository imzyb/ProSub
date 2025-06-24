<script setup>
import { ref, onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import LoginView from './views/LoginView.vue';
import { store } from './store.js';
import { useToast } from 'vue-toastification';

const toast = useToast();
const sessionState = ref('loading');

async function checkSessionAndFetchData() {
  try {
    const response = await fetch('/api/nodes'); // 尝试访问一个受保护的API
    if (response.ok) {
      sessionState.value = 'loggedIn';
      // 登录成功后，再获取所有数据
      await store.fetchData();
    } else {
      sessionState.value = 'loggedOut';
    }
  } catch (error) {
    sessionState.value = 'loggedOut';
  }
}

function handleLoginSuccess() {
  sessionState.value = 'loggedIn';
  store.fetchData(); // 登录成功后获取数据
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
}

onMounted(checkSessionAndFetchData);
</script>

<template>
  <div v-if="sessionState === 'loggedIn'" class="app-layout">
    <aside class="sidebar">
      <h1 class="logo">ProSub</h1>
      <nav class="main-nav">
        <RouterLink to="/nodes" class="nav-item">节点管理</RouterLink>
        <RouterLink to="/profiles" class="nav-item">输出配置</RouterLink>
        <RouterLink to="/settings" class="nav-item">系统设置</RouterLink>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
    </aside>
    <main class="content-pane">
      <RouterView />
    </main>
  </div>
  <LoginView v-else-if="sessionState === 'loggedOut'" :on-login-success="handleLoginSuccess" />
  <div v-else class="loading-screen">
    <p>正在加载...</p>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 240px;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  flex-shrink: 0;
}
.logo {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
  color: var(--primary);
}
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-item {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover {
  background-color: var(--color-background);
  color: var(--text-primary);
}
.router-link-exact-active {
  background-color: var(--primary);
  color: var(--text-light);
}
.sidebar-footer {
  margin-top: auto;
}
.logout-btn {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius);
}
.logout-btn:hover {
  background-color: var(--color-background);
  border-color: var(--text-secondary);
}
.content-pane {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
}
.loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; }

@media (max-width: 768px) {
  .sidebar {
    display: none; /* 在手机端先简单隐藏，未来可做成抽屉式菜单 */
  }
  .content-pane {
    padding: 1rem;
  }
}
</style>