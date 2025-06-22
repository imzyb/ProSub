<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  node: Object, // 接收一个解析后的节点对象
});
const emit = defineEmits(['close']);

// 过滤掉一些不需要展示的内部字段
const filteredNode = computed(() => {
    if (!props.node) return null;
    const { id, isUpdating, ...remaning } = props.node;
    return remaning;
});

</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>节点详情: {{ node.name || 'N/A' }}</h3>
      <div v-if="filteredNode" class="details-grid">
        <template v-for="(value, key) in filteredNode" :key="key">
          <div class="detail-key">{{ key }}</div>
          <div class="detail-value">
            <span v-if="typeof value === 'boolean'" :class="value ? 'bool-true' : 'bool-false'">
              {{ value }}
            </span>
            <pre v-else-if="typeof value === 'object'">{{ JSON.stringify(value, null, 2) }}</pre>
            <span v-else>{{ value }}</span>
          </div>
        </template>
      </div>
      <button @click="emit('close')" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-content {
  background: white; padding: 2rem; border-radius: 8px;
  width: 90%; max-width: 600px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
h3 {
  margin-top: 0; margin-bottom: 1.5rem; font-size: 1.5rem; color: #333;
  border-bottom: 1px solid #eee; padding-bottom: 1rem;
}
.details-grid {
  display: grid; grid-template-columns: 120px 1fr;
  gap: 0.8rem; max-height: 60vh; overflow-y: auto;
  font-size: 0.9rem;
}
.detail-key {
  font-weight: bold; color: #555; word-break: break-all;
  padding-right: 1rem;
}
.detail-value {
  font-family: monospace, 'Courier New', Courier; background: #f4f4f4;
  padding: 0.4rem 0.6rem; border-radius: 4px; word-break: break-all;
  white-space: pre-wrap; /* 保证pre标签能换行 */
}
.bool-true { color: #28a745; font-weight: bold; }
.bool-false { color: #dc3545; font-weight: bold; }
pre { margin: 0; }
.close-btn {
  margin-top: 2rem; float: right;
  background-color: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem;
  border-radius: 5px; cursor: pointer;
}
</style>