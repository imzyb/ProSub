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
      <div class="header-content">
        <h1 class="logo">ProSub</h1>
        <nav class="dashboard-nav">
          <RouterLink to="/dashboard/nodes" class="nav-link">节点管理</RouterLink>
          <RouterLink to="/dashboard/profiles" class="nav-link">输出配置</RouterLink>
          <RouterLink to="/dashboard/settings" class="nav-link">系统设置</RouterLink>
        </nav>
      </div>
      <button @click="handleLogout" class="btn btn-outline-secondary">登出</button>
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
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  position: sticky; top: 0; z-index: 10;
  box-shadow: var(--shadow-sm);
}
.header-content { display: flex; align-items: center; }
.logo { font-size: 1.5rem; font-weight: 700; margin: 0; }
.dashboard-nav { display: flex; margin-left: 2.5rem; }
.nav-link {
  padding: 0 1rem;
  line-height: 64px;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.nav-link:hover { color: var(--text-primary); }
.router-link-exact-active { color: var(--primary); border-bottom-color: var(--primary); }
.dashboard-main-content { padding: 2rem; }
@media (max-width: 768px) {
  .dashboard-header { padding: 0 1rem; }
  .dashboard-nav { display: none; }
  .dashboard-main-content { padding: 1rem; }
}
</style>