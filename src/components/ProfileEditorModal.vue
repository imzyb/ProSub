<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  show: Boolean,
  profile: Object, // 接收用于编辑的Profile对象，为null则是新增
  nodes: Array,    // 接收所有可用节点，用于渲染复选框
});

const emit = defineEmits(['close', 'save']);

// 定义表单的初始状态
const getInitialFormState = () => ({
  name: '',
  outputFormat: 'Clash',
  selectedRuleSets: [],
  userCustomRulesString: '',
  nodeIds: [],
});

const formData = ref(getInitialFormState());
const isEditing = computed(() => !!(props.profile && props.profile.id));

// 【新增】全选/反选逻辑
function selectAllRules() {
  formData.value.selectedRuleSets = availableRuleSets.map(r => r.id);
}
function invertSelectionRules() {
  const allRuleIds = availableRuleSets.map(r => r.id);
  const currentSelection = new Set(formData.value.selectedRuleSets);
  formData.value.selectedRuleSets = allRuleIds.filter(id => !currentSelection.has(id));
}
function selectAllNodes() {
  formData.value.nodeIds = props.nodes.map(n => n.id);
}
function invertSelectionNodes() {
  const allNodeIds = props.nodes.map(n => n.id);
  const currentSelection = new Set(formData.value.nodeIds);
  formData.value.nodeIds = allNodeIds.filter(id => !currentSelection.has(id));
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (isEditing.value) {
      // 编辑模式：填充表单
      formData.value = {
        ...props.profile,
        userCustomRulesString: Array.isArray(props.profile.userCustomRules) ? props.profile.userCustomRules.join('\n') : '',
        selectedRuleSets: props.profile.selectedRuleSets || [],
      };
    } else {
      // 新增模式：重置表单
      formData.value = getInitialFormState();
    }
  }
});

// 在前端也定义一份规则集，用于渲染UI
const availableRuleSets = [
    { id: 'Lan', name: '局域网' },
    { id: 'Apple', name: '苹果服务' },
    { id: 'Microsoft', name: '微软服务' },
    { id: 'Google', name: '谷歌服务' },
    { id: 'Proxy', name: '国外网站' },
    { id: 'Cn', name: '国内网站' },
    { id: 'Telegram', name: '电报' },
    { id: 'Private', name: '私人' },
    { id: 'Domestic', name: '家庭' },
    { id: 'Ads', name: '广告拦截' }
];

function handleSubmit() {
  emit('save', formData.value);
  emit('close');
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>{{ isEditing ? '编辑输出配置' : '新增输出配置' }}</h3>
      <form @submit.prevent="handleSubmit" id="profile-editor-form">
        <div class="form-group">
          <label for="profile-name">配置名称</label>
          <input id="profile-name" v-model="formData.name" type="text" placeholder="例如: 家庭Clash" required/>
        </div>
        <div class="form-group">
          <label for="profile-format">输出格式</label>
          <select id="profile-format" v-model="formData.outputFormat">
            <option>Clash</option>
            <option>V2Ray</option>
          </select>
        </div>
        <fieldset>
          <legend>选择内置Clash规则集:</legend>
          <div class="selection-actions">
            <button type="button" @click="selectAllRules" class="btn-link">全选</button>
            <button type="button" @click="invertSelectionRules" class="btn-link">反选</button>
          </div>
          <div class="checkbox-grid">
              </div>
        </fieldset>
        <fieldset>
          <legend>选择要包含的节点:</legend>
          <div class="selection-actions">
            <button type="button" @click="selectAllNodes" class="btn-link">全选</button>
            <button type="button" @click="invertSelectionNodes" class="btn-link">反选</button>
          </div>
          <div v-if="nodes.length > 0" class="checkbox-grid node-selection">
              </div>
          <p v-else>暂无节点...</p>
        </fieldset>
      </form>
      <div class="modal-actions">
        <button @click="emit('close')" class="btn-secondary">取消</button>
        <button type="submit" form="profile-editor-form" class="btn-primary">{{ isEditing ? '更新' : '创建' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
h3 { margin-top: 0; margin-bottom: 1.5rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.8rem; }
.node-selection { max-height: 200px; overflow-y: auto; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
.selection-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
}
.btn-link {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 0;
    font-size: 0.85rem;
}
.btn-primary { background-color: #007bff; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
.btn-secondary { background-color: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 5px; cursor: pointer; }
</style>