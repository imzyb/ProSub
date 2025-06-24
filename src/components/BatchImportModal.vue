<script setup>
// Script部分与我们最终的稳定版本完全相同
</script>
<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content card" @click.stop>
      <h2 class="modal-title">批量导入节点</h2>
      <p class="modal-description">请粘贴一个或多个节点分享链接，每行一个。程序将自动尝试解析节点名称。</p>
      <textarea v-model="urlsText" rows="15" placeholder="vmess://...#节点1&#10;ss://...#节点2"></textarea>
      <div class="modal-actions">
        <button @click="emit('close')" class="btn btn-outline-secondary">取消</button>
        <button @click="handleSave" class="btn btn-primary">导入</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* 样式与NodeEditorModal非常类似，确保风格统一 */
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { max-width: 700px; padding: 1.5rem 2rem 2rem; margin: 0; }
.modal-title { font-size: 1.25rem; font-weight: 600; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal-description { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem; }
textarea { width: 100%; border: 1px solid var(--color-border); font-family: var(--font-mono); }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
</style>