<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import Spinner from '../components/Spinner.vue';

const props = defineProps({
  onLoginSuccess: {
    type: Function,
    required: true,
  }
});

const toast = useToast();
const password = ref('');
const isLoading = ref(false);

async function submitLogin() {
  if (!password.value) {
    toast.error('请输入密码');
    return;
  }
  isLoading.value = true;
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    });

    if (response.ok) {
      // 登录成功，调用父组件(App.vue)传来的函数来更新会话状态
      props.onLoginSuccess();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || '登录失败');
    }
  } catch (err) {
    toast.error(err.message);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">ProSub</h1>
      <p class="subtitle">请输入管理员密码以继续</p>
      <form @submit.prevent="submitLogin" class="login-form">
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          class="password-input"
        />
        <button type="submit" class="btn-primary" :disabled="isLoading">
          <Spinner v-if="isLoading" />
          <span v-else>授权访问</span>
        </button>
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
  margin: 1rem;
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
.login-form {
  display: flex;
  flex-direction: column;
}
.password-input {
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 1rem;
}
button {
  width: 100%;
}
</style>