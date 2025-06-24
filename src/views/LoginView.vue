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
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
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
}
.login-card {
  text-align: center;
  width: 100%;
  max-width: 400px;
  padding: 3rem;
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
  gap: 1.5rem;
}
input {
  font-size: 1rem;
}
button {
  width: 100%;
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
}
</style>