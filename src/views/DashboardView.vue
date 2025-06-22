<script setup>
import { onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { store } from '../store.js'; // 导入我们的全局Store

// 在主面板组件被加载时，调用store的fetchData方法
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
      <div class="header-left">
        <h1>ProSub</h1>
        <nav class="dashboard-nav">
          <RouterLink to="/dashboard/nodes" class="nav-link">节点管理</RouterLink>
          <RouterLink to="/dashboard/profiles" class="nav-link">输出配置</RouterLink>
          <RouterLink to="/dashboard/settings" class="nav-link">系统设置</RouterLink>
        </nav>
      </div>
      <div class="header-right">
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
    </header>
    <main class="dashboard-main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex; flex-direction: column; height: 100vh; background-color: #f0f2f5;
}
.dashboard-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; background-color: white;
  border-bottom: 1px solid #dee2e6; flex-shrink: 0;
}
.header-left { display: flex; align-items: center; }
h1 { font-size: 1.5rem; font-weight: 600; color: #333; }
.dashboard-nav { display: flex; margin-left: 2rem; gap: 1rem; }
.nav-link {
  padding: 1.5rem 1rem; text-decoration: none; color: #495057;
  font-weight: 500; border-bottom: 3px solid transparent; transition: all 0.2s ease-in-out;
}
.nav-link:hover { color: #007bff; }
.router-link-exact-active { color: #007bff; border-bottom-color: #007bff; }
.dashboard-main-content { flex-grow: 1; overflow-y: auto; padding: 2rem; }

/* 【新增】登出按钮样式 */
.logout-btn {
    background-color: transparent;
    color: #6c757d;
    border: 1px solid #6c757d;
    padding: 0.4rem 0.8rem;
    border-radius: 5px;
    font-weight: 500;
    cursor: pointer;
}
.logout-btn:hover {
    background-color: #6c757d;
    color: white;
}
</style>