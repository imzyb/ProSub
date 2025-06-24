<script setup>
// Script部分与我们最终的稳定版本完全相同
</script>
<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content card" @click.stop>
      <h2 class="modal-title">节点详情: {{ node.name || 'N/A' }}</h2>
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
/* 样式与NodeEditorModal非常类似，确保风格统一 */
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; padding: 1.5rem 2rem 2rem; margin: 0; }
.modal-title { font-size: 1.25rem; font-weight: 600; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
.details-grid { display: grid; grid-template-columns: 120px 1fr; gap: 1rem; overflow-y: auto; font-size: 0.9rem; }
.detail-key { font-weight: 600; color: var(--text-secondary); word-break: break-all; padding-right: 1rem; }
.detail-value { font-family: var(--font-mono); background: var(--color-background); padding: 0.4rem 0.6rem; border-radius: 0.375rem; word-break: break-all; white-space: pre-wrap; }
.bool-true { color: var(--success); font-weight: bold; }
.bool-false { color: var(--danger); font-weight: bold; }
pre { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border); }
</style>