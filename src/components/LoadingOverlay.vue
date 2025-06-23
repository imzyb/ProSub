<template>
  <div v-if="show" class="overlay-backdrop">
    <div class="spinner-container">
      <Spinner />
      <p>处理中...</p>
    </div>
  </div>
</template>

<script setup>
import Spinner from './Spinner.vue';
defineProps({ show: Boolean });
</script>

<style scoped>
.overlay-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #007bff;
  font-weight: 500;
}
.spinner-container .spinner {
    font-size: 2rem;
}
</style>