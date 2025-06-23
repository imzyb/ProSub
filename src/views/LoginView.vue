<script setup>
// Script部分与之前版本完全相同
</script>
<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">ProSub</h1>
      <p class="subtitle">请输入管理员密码以继续</p>
      <form @submit.prevent="submitLogin">
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit" class="btn-primary" :disabled="isLoading">
          <Spinner v-if="isLoading" />
          <span v-else>授权访问</span>
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>
<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-background);
}
.login-card {
  background: var(--color-surface);
  padding: 3rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  text-align: center;
  width: 100%;
  max-width: 420px;
  border: 1px solid var(--color-border);
}
.title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}
.subtitle {
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
}
input {
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ccc;
  border-radius: var(--border-radius);
}
button { width: 100%; }
.error-message { color: var(--danger); margin-top: 1rem; margin-bottom: 0; }
</style>