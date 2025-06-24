<script setup>
import { ref, watch, computed } from 'vue';
import Spinner from './Spinner.vue';
import { parseNodeUrl } from '../utils.js';

const props = defineProps({
  show: Boolean,
  node: Object,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'save']);

const getInitialState = () => ({ name: '', url: '' });
const formData = ref(getInitialState());

const isEditing = computed(() => !!(props.node && props.node.id));

watch(() => props.show, (newVal) => {
  if (newVal) {
    formData.value = isEditing.value ? { ...props.node } : getInitialState();
  }
});

watch(() => formData.value.url, (newUrl) => {
  if (newUrl && !formData.value.name) {
    const parsed = parseNodeUrl(newUrl);
    if (parsed && parsed.name && parsed.name !== '未命名') {
      formData.value.name = parsed.name;
    }
  }
});

function handleSubmit() {
  if (props.isSaving) return;
  emit('save', formData.value);
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content card" @click.stop>
      <h2 class="modal-title">{{ isEditing ? '编辑节点' : '新增节点' }}</h2>
      <form @submit.prevent="handleSubmit" id="node-editor-form" class="modal-form">
        <div class="form-group">
          <label for="node-name">名称</label>
          <input id="node-name" v-model="formData.name" type="text" placeholder="节点或订阅名称" required />
        </div>
        <div class="form-group">
          <label for="node-url">URL</label>
          <input id="node-url" v-model="formData.url" type="text" placeholder="粘贴订阅链接或节点分享链接" required />
        </div>
      </form>
      <div class="modal-actions">
        <button type="button" @click="emit('close')" class="btn btn-outline-secondary">取消</button>
        <button type="submit" form="node-editor-form" class="btn btn-primary" :disabled="isSaving">
          <Spinner v-if="isSaving" />
          <span v-else>{{ isEditing ? '更新' : '创建' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

/* 使用.card样式，但覆盖一些边距 */
.modal-content {
  width: 100%;
  max-width: 500px;
  margin-bottom: 0;
}

.modal-title {
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* 输入框样式将继承自 main.css */
.form-group input {
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
</style>