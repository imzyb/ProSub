<script setup>
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <h1>ProSub</h1>
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
  height: 100vh;
  background-color: #f0f2f5;
}
.dashboard-header {
  display: flex;
  align-items: center;
  padding: 0 2rem;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  flex-shrink: 0;
}
h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}
.dashboard-nav {
  display: flex;
  margin-left: 2rem;
  gap: 1rem;
}
.nav-link {
  padding: 1.5rem 1rem;
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease-in-out;
}
.nav-link:hover {
  color: #007bff;
}
/* vue-router会自动为当前激活的链接添加这个class */
.router-link-exact-active {
  color: #007bff;
  border-bottom-color: #007bff;
}
.dashboard-main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>