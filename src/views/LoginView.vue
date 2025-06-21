<script setup>
import { ref } from 'vue';

const props = defineProps({
  // 从 App.vue 接收一个名为 onLoginSuccess 的函数
  onLoginSuccess: Function,
});

const password = ref('');
const isLoading = ref(false);
const error = ref('');

async function submitLogin() {
  if (!password.value) {
    error.value = '请输入密码';
    return;
  }
  isLoading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    });

    if (response.ok) {
      // 登录成功，调用父组件传来的函数
      props.onLoginSuccess();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || '登录失败');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>ProSub</h1>
      <p>请输入管理员密码</p>
      <form @submit.prevent="submitLogin">
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '授权访问' }}
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
  min-height: 80vh;
}
.login-card {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  text-align: center;
  width: 100%;
  max-width: 400px;
}
h1 {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
}
p {
  color: #666;
  margin-bottom: 2rem;
}
input {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:disabled {
  background-color: #aaa;
}
.error-message {
  color: #dc3545;
  margin-top: 1rem;
  margin-bottom: 0;
}
</style>