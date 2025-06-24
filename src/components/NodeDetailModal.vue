<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  node: Object,
});
const emit = defineEmits(['close']);

const filteredNode = computed(() => {
    if (!props.node) return null;
    const { id, isUpdating, remark, ...remaining } = props.node;
    return remaining;
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
            <span v-if="typeof value === 'boolean'" :class="value ? 'bool-true' : 'bool-false'">{{ value }}</span>
            <pre v-else-if="typeof value === 'object'">{{ JSON.stringify(value, null, 2) }}</pre>
            <span v-else>{{ value }}</span>
          </div>
        </template>
      </div>
      <div class="modal-actions">
          <button @click="emit('close')" class="btn btn-secondary">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { background: var(--color-surface); padding: 2rem; border-radius: var(--border-radius); width: 90%; max-width: 600px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; max-height: 90vh; border: 1px solid var(--color-border); }
h3 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.5rem; color: var(--text-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; }
.details-grid { display: grid; grid-template-columns: 120px 1fr; gap: 1rem; overflow-y: auto; font-size: 0.9rem; }
.detail-key { font-weight: 600; color: var(--text-secondary); word-break: break-all; padding-right: 1rem; }
.detail-value { font-family: var(--font-mono); background: var(--color-background); padding: 0.4rem 0.6rem; border-radius: 0.375rem; word-break: break-all; white-space: pre-wrap; }
.bool-true { color: var(--success); font-weight: bold; }
.bool-false { color: var(--danger); font-weight: bold; }
pre { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 2rem; }
</style>