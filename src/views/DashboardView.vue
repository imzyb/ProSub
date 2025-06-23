<script setup>
import { RouterView, RouterLink } from 'vue-router';
import { onMounted } from 'vue';
import { store } from '../store.js';
import { useToast } from 'vue-toastification';

const toast = useToast();

// 在主面板组件被加载时，调用store的fetchData方法
// 并增加了错误捕获，确保在加载失败时用户能收到提示
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
        toast.error("登出失败");
    }
}
</script>

<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="header-content">
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
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background, #f4f7f9);
}
.dashboard-header {
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e9ecef);
  flex-shrink: 0;
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 2rem;
}
.logo {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary, #1f2937);
}
.dashboard-nav {
  display: flex;
  margin: 0 auto; /* 让导航在桌面端居中 */
  padding: 0 2rem;
  gap: 1.5rem;
  border-top: 1px solid var(--color-border, #e9ecef);
}
.nav-link {
  padding: 0.75rem 0;
  text-decoration: none;
  color: var(--text-secondary, #6c757d);
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease-in-out;
}
.nav-link:hover {
  color: var(--text-primary, #1f2937);
}
.router-link-exact-active {
  color: var(--primary, #4338ca);
  border-bottom-color: var(--primary, #4338ca);
}
.logout-btn {
  background-color: transparent;
  color: var(--text-secondary, #6c757d);
  border: 1px solid var(--color-border, #e9ecef);
}
.dashboard-main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* 【核心修正】手机端的响应式样式 */
@media (max-width: 768px) {
  .header-content {
    height: 60px;
    padding: 0 1rem;
  }
  .dashboard-nav {
    width: 100%;
    gap: 0;
    padding: 0;
  }
  .nav-link {
    flex-grow: 1;
    text-align: center;
    padding: 0.8rem 0.5rem;
    font-size: 0.9rem;
  }
  .dashboard-main-content {
    padding: 1rem;
  }
}
</style>