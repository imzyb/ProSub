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
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column; /* 将标题和导航变为垂直排列 */
    align-items: flex-start; /* 左对齐 */
    padding: 1rem; /* 缩小内边距 */
    height: auto; /* 高度自适应 */
  }
  .dashboard-nav {
    margin-left: 0;
    margin-top: 1rem; /* 增加与标题的间距 */
    gap: 0; /* 移除链接间的固定间距 */
    width: 100%;
    justify-content: space-around; /* 让链接均匀分布 */
  }
  .nav-link {
    padding: 0.75rem 0.5rem; /* 缩小每个链接的内边距 */
    font-size: 0.9rem;
  }
  .dashboard-main-content {
    padding: 1rem; /* 缩小主内容区的内边距 */
  }
  .header-right {
    position: absolute; /* 将登出按钮移动到右上角 */
    top: 1rem;
    right: 1rem;
  }
}
</style>