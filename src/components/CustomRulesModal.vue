<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  rules: String, // 接收传入的规则字符串
});
const emit = defineEmits(['close', 'save']);

const localRules = ref('');

// 监听传入的rules变化，同步到本地
watch(() => props.rules, (newVal) => {
  localRules.value = newVal;
});

function handleSave() {
  emit('save', localRules.value);
  emit('close');
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>编辑自定义规则</h3>
      <p class="modal-description">在这里输入您自己的Clash规则，每行一条。这些规则将拥有最高匹配优先级。</p>
      <textarea v-model="localRules" rows="15"></textarea>
      <div class="modal-actions">
        <button @click="emit('close')" class="btn-secondary">取消</button>
        <button @click="handleSave" class="btn-primary">保存规则</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
h3 { margin-top: 0; }
.modal-description { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }
textarea { width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; font-family: monospace; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-primary { background-color: #007bff; }
.btn-secondary { background-color: #6c757d; }
</style>