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
    <div class="login-card card">
      <h1 class="title">ProSub</h1>
      <p class="subtitle">请输入管理员密码以继续</p>
      <form @submit.prevent="submitLogin" class="login-form">
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <Spinner v-if="isLoading" />
          <span>授权访问</span>
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>
<style scoped>
.login-container { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 100vh; }
.login-card { text-align: center; width: 100%; max-width: 400px; padding: 3rem; }
.title { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5rem; }
.subtitle { color: var(--text-secondary); margin-bottom: 2.5rem; }
.login-form { display: flex; flex-direction: column; gap: 1.5rem; }
input { font-size: 1rem; }
button { width: 100%; padding: 0.8rem; }
.error-message { color: var(--danger); margin-top: -0.5rem; }
</style>