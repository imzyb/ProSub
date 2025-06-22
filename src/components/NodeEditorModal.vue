<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  show: Boolean,
  node: Object,
  isSaving: Boolean, // 新增：接收一个是否正在保存的状态
});

const emit = defineEmits(['close', 'save']);
const formData = ref({ name: '', url: '' });
const isEditing = computed(() => !!(props.node && props.node.id));

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (isEditing.value) {
      formData.value = { ...props.node };
    } else {
      formData.value = { name: '', url: '' };
    }
  }
});

function handleSubmit() {
  if (props.isSaving) return; // 如果正在保存，则不重复提交
  emit('save', formData.value);
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>{{ isEditing ? '编辑节点' : '新增节点' }}</h3>
      <form @submit.prevent="handleSubmit" id="node-editor-form">
        <div class="form-group">
          <label for="node-name">名称</label>
          <input id="node-name" v-model="formData.name" type="text" placeholder="节点或订阅名称" />
        </div>
        <div class="form-group">
          <label for="node-url">URL</label>
          <input id="node-url" v-model="formData.url" type="text" placeholder="粘贴订阅链接或节点分享链接" />
        </div>
      </form>
      <div class="modal-actions">
        <button @click="emit('close')" class="btn-secondary">取消</button>
        <button type="submit" form="node-editor-form" class="btn-primary" :disabled="isSaving">
          <Spinner v-if="isSaving" />
          <span v-else>{{ isEditing ? '更新' : '创建' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
h3 { margin-top: 0; margin-bottom: 1.5rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-group input { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
.btn-primary { background-color: #007bff; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
.btn-secondary { background-color: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
</style>