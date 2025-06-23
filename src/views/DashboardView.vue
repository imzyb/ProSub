<script setup>
import { onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { store } from '../store.js';
import { useToast } from 'vue-toastification';

const toast = useToast();

onMounted(async () => {
    try {
        await store.fetchData();
    } catch (e) {
        toast.error(e.message || '数据加载失败');
    }
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
      <div class="header-content">
        <h1 class="logo">ProSub</h1>
        <nav class="dashboard-nav">
          <RouterLink to="/dashboard/nodes" class="nav-link">节点管理</RouterLink>
          <RouterLink to="/dashboard/profiles" class="nav-link">输出配置</RouterLink>
          <RouterLink to="/dashboard/settings" class="nav-link">系统设置</RouterLink>
        </nav>
      </div>
      <button @click="handleLogout" class="logout-btn">登出</button>
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
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.header-content { display: flex; align-items: center; }
.logo { font-size: 1.5rem; font-weight: 700; margin: 0; }
.dashboard-nav { display: flex; margin-left: 2.5rem; }
.nav-link { padding: 0 0.5rem; line-height: 64px; text-decoration: none; color: var(--text-secondary); font-weight: 500; border-bottom: 3px solid transparent; }
.nav-link:hover { color: var(--text-primary); }
.router-link-exact-active { color: var(--primary); border-bottom-color: var(--primary); }
.logout-btn { background-color: var(--color-background); color: var(--text-secondary); border: 1px solid var(--color-border); }
.dashboard-main-content { flex-grow: 1; padding: 2rem; }

@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; height: auto; padding: 1rem; }
  .header-content { width: 100%; justify-content: space-between; }
  .dashboard-nav { display: none; } /* 在手机端先隐藏，未来可做成菜单 */
}
</style>