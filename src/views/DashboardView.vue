<script setup>
import { onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { store } from '../store.js';
import { useToast } from 'vue-toastification';

const toast = useToast();

onMounted(async () => {
    store.fetchData();
});

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch(e) {
        toast.error("登出失败");
    }
}
</script>

<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="header-main">
        <h1 class="logo">ProSub</h1>
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
      <nav class="dashboard-nav">
        <RouterLink to="/dashboard/nodes" class="nav-link">节点管理</RouterLink>
        <RouterLink to="/dashboard/profiles" class="nav-link">输出配置</RouterLink>
        <RouterLink to="/dashboard/settings" class="nav-link">系统设置</RouterLink>
      </nav>
    </header>
    <main class="dashboard-main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout { display: flex; flex-direction: column; min-height: 100vh; }
.dashboard-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 1.5rem;
}
.logo { font-size: 1.5rem; font-weight: 700; margin: 0; }
.dashboard-nav { display: flex; gap: 1rem; padding: 0 1.5rem; }
.nav-link {
  padding: 0.75rem 0.25rem;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease-in-out;
}
.nav-link:hover { color: var(--text-primary); }
.router-link-exact-active { color: var(--primary); border-bottom-color: var(--primary); }
.logout-btn {
  background-color: var(--color-surface);
  color: var(--text-secondary);
  border: 1px solid var(--color-border);
  padding: 0.4rem 0.8rem;
}
.logout-btn:hover { background-color: var(--color-background); }
.dashboard-main-content { flex-grow: 1; padding: 2rem; }

@media (max-width: 768px) {
  .header-main { padding: 0 1rem; }
  .dashboard-nav { justify-content: space-around; }
  .nav-link { flex-grow: 1; text-align: center; }
  .dashboard-main-content { padding: 1rem; }
}
</style>