<script setup>
import { ref } from 'vue';
const emit = defineEmits(['close', 'save']);
const urlsText = ref('');

function handleSave() {
  const urls = urlsText.value.split('\n').map(url => url.trim()).filter(Boolean);
  if (urls.length > 0) {
    emit('save', urls);
  }
  emit('close');
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>批量导入节点</h3>
      <p class="modal-description">请粘贴一个或多个节点分享链接，每行一个。程序将自动尝试解析节点名称。</p>
      <textarea v-model="urlsText" rows="15" placeholder="vmess://...#节点1&#10;ss://...#节点2&#10;vless://..."></textarea>
      <div class="modal-actions">
        <button @click="emit('close')" class="btn-secondary">取消</button>
        <button @click="handleSave" class="btn-primary">导入</button>
      </div>
    </div>
  </div>
</template>

<script>
// 定义 show prop，尽管在 <script setup> 中未使用，但这是组件接口的一部分
export default {
  props: {
    show: Boolean,
  },
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
h3 { margin-top: 0; }
.modal-description { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }
textarea { width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; font-family: monospace; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-primary { background-color: #007bff; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
.btn-secondary { background-color: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
</style>