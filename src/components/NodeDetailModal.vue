<script setup>
const props = defineProps({
  show: Boolean,
  node: Object, // 接收一个解析后的节点对象
});
const emit = defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>节点详情</h3>
      <div v-if="node" class="details-grid">
        <template v-for="(value, key) in node" :key="key">
          <div class="detail-key">{{ key }}</div>
          <div class="detail-value">{{ value }}</div>
        </template>
      </div>
      <button @click="emit('close')" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}
.details-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.8rem;
  max-height: 60vh;
  overflow-y: auto;
}
.detail-key {
  font-weight: bold;
  color: #555;
  word-break: break-all;
}
.detail-value {
  font-family: monospace;
  background: #f4f4f4;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}
.close-btn {
  margin-top: 2rem;
  float: right;
}
</style>