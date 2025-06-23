<script setup>
import { onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { store } from '../store.js';

onMounted(() => {
    store.fetchData();
});

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch(e) {
        console.error("Logout failed:", e);
    }
}
</script>

<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="header-main">
        <h1>ProSub</h1>
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
.dashboard-layout { display: flex; flex-direction: column; height: 100vh; background-color: #f0f2f5; }
.dashboard-header { padding: 0 1.5rem; background-color: white; border-bottom: 1px solid #dee2e6; flex-shrink: 0; }
.header-main { display: flex; align-items: center; justify-content: space-between; height: 60px; }
h1 { font-size: 1.5rem; font-weight: 600; color: #333; }
.dashboard-nav { display: flex; gap: 1rem; }
.nav-link { padding: 0.75rem 0; margin-bottom: -1px; text-decoration: none; color: #495057; font-weight: 500; border-bottom: 3px solid transparent; transition: all 0.2s ease-in-out; }
.nav-link:hover { color: #007bff; }
.router-link-exact-active { color: #007bff; border-bottom-color: #007bff; }
.logout-btn { background-color: transparent; color: #6c757d; border: 1px solid #ced4da; padding: 0.4rem 0.8rem; border-radius: 5px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.logout-btn:hover { background-color: #6c757d; color: white; }
.dashboard-main-content { flex-grow: 1; overflow-y: auto; padding: 1.5rem; }

@media (max-width: 768px) {
  .dashboard-header { padding: 0; }
  .header-main { padding: 0 1rem; }
  .dashboard-nav { width: 100%; gap: 0; border-top: 1px solid #dee2e6; }
  .nav-link { flex-grow: 1; text-align: center; padding: 0.75rem 0.5rem; }
  .dashboard-main-content { padding: 1rem; }
}
</style>