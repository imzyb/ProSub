<script setup>
import { ref, watch, computed } from 'vue';
import Spinner from './Spinner.vue';
import { parseNodeUrl } from '../utils.js'; // 【核心修正】导入解析函数

const props = defineProps({
  show: Boolean,
  profile: Object,
  nodes: Array,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'save']);

const getInitialFormState = () => ({
  name: '',
  outputFormat: 'Clash',
  selectedRuleSets: [],
  nodeIds: [],
});

const formData = ref(getInitialFormState());
const isEditing = computed(() => !!(props.profile && props.profile.id));

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (isEditing.value) {
      formData.value = {
        ...props.profile,
        selectedRuleSets: props.profile.selectedRuleSets || [],
      };
    } else {
      formData.value = getInitialFormState();
    }
  }
});

// 【核心修正】将 getProtocolInfo 函数添加到本组件中
function getProtocolInfo(nodeUrl) {
    const parsed = parseNodeUrl(nodeUrl);
    const protocol = parsed ? parsed.protocol : 'unknown';
    switch (protocol) {
        case 'vmess': return { text: 'VMESS', style: 'protocol-vmess' };
        case 'vless': return { text: 'VLESS', style: 'protocol-vless' };
        case 'trojan': return { text: 'TROJAN', style: 'protocol-trojan' };
        case 'ss': return { text: 'SS', style: 'protocol-ss' };
        case 'hysteria2': return { text: 'HY2', style: 'protocol-hysteria2' };
        case 'http': case 'https': return { text: 'SUB', style: 'protocol-sub' };
        default: return { text: 'LINK', style: 'protocol-unknown' };
    }
}

const availableRuleSets = [
    { id: 'Lan', name: '局域网' }, { id: 'Apple', name: '苹果服务' },
    { id: 'Microsoft', name: '微软服务' }, { id: 'Google', name: '谷歌服务' },
    { id: 'Proxy', name: '国外网站' }, { id: 'Cn', name: '国内网站' },
    { id: 'Telegram', name: '电报' }, { id: 'Private', name: '私人' },
    { id: 'Domestic', name: '家庭' }, { id: 'Ads', name: '广告拦截' }
];

function selectAllRules() { formData.value.selectedRuleSets = availableRuleSets.map(r => r.id); }
function invertSelectionRules() {
  const allRuleIds = availableRuleSets.map(r => r.id);
  const currentSelection = new Set(formData.value.selectedRuleSets);
  formData.value.selectedRuleSets = allRuleIds.filter(id => !currentSelection.has(id));
}
function selectAllNodes() { formData.value.nodeIds = props.nodes.map(n => n.id); }
function invertSelectionNodes() {
  const allNodeIds = props.nodes.map(n => n.id);
  const currentSelection = new Set(formData.value.nodeIds);
  formData.value.nodeIds = allNodeIds.filter(id => !currentSelection.has(id));
}

function handleSubmit() {
  if (props.isSaving) return;
  emit('save', formData.value);
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
            <option>V2RayN</option>
            <option>sing-box</option>
            <option>Loon</option>
            <option>Surge</option>
          </select>
        </div>
        <fieldset>
          <legend>选择内置Clash规则集</legend>
          <div class="selection-actions">
            <button type="button" @click="selectAllRules" class="btn-link">全选</button>
            <button type="button" @click="invertSelectionRules" class="btn-link">反选</button>
          </div>
          <div class="checkbox-grid">
            <div v-for="ruleSet in availableRuleSets" :key="ruleSet.id" class="checkbox-item">
              <input type="checkbox" :id="`modal-ruleset-${ruleSet.id}`" :value="ruleSet.id" v-model="formData.selectedRuleSets">
              <label :for="`modal-ruleset-${ruleSet.id}`" class="checkbox-label">{{ ruleSet.name }}</label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>选择要包含的节点</legend>
          <div class="selection-actions">
            <button type="button" @click="selectAllNodes" class="btn-link">全选</button>
            <button type="button" @click="invertSelectionNodes" class="btn-link">反选</button>
          </div>
          <div v-if="nodes && nodes.length > 0" class="checkbox-grid node-selection">
            <div v-for="node in nodes" :key="node.id" class="checkbox-item">
              <input type="checkbox" :id="`modal-node-sel-${node.id}`" :value="node.id" v-model="formData.nodeIds">
              <label :for="`modal-node-sel-${node.id}`" class="checkbox-label">
                  <span class="protocol-badge" :class="getProtocolInfo(node.url).style">
                      {{ getProtocolInfo(node.url).text }}
                  </span>
                  <span>{{ node.name }}</span>
              </label>
            </div>
          </div>
          <p v-else>暂无节点，请先前往“节点管理”页面添加。</p>
        </fieldset>
      </form>
      <div class="modal-actions">
        <button type="button" @click="emit('close')" class="btn btn-outline-secondary">取消</button>
        <button type="submit" form="profile-editor-form" class="btn btn-primary" :disabled="isSaving">
            <Spinner v-if="isSaving" />
            <span v-else>{{ isEditing ? '更新' : '创建' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { background: white; padding: 2rem; border-radius: 0.5rem; width: 100%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; display: flex; flex-direction: column; }
h3 { margin-top: 0; margin-bottom: 1.5rem; }
form { display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; padding-right: 0.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; }
fieldset { border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: 600; color: var(--text-primary); }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.node-selection { max-height: 200px; overflow-y: auto; }
.checkbox-item, .checkbox-label { display: flex; align-items: center; gap: 0.5rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; flex-shrink: 0; }
.selection-actions { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
.btn-link { background: none; border: none; color: var(--primary); cursor: pointer; padding: 0; font-size: 0.85rem; }
.protocol-badge { font-size: 0.7rem; font-weight: bold; padding: 0.1rem 0.4rem; border-radius: 9999px; color: white; }
.protocol-vmess { background-color: #10b981; }
.protocol-vless { background-color: #3b82f6; }
.protocol-trojan { background-color: #ef4444; }
.protocol-ss { background-color: #f97316; }
.protocol-hysteria2 { background-color: #8b5cf6; }
.protocol-sub { background-color: #64748b; }
.protocol-unknown { background-color: #9ca3af; }
@media (max-width: 768px) {
  .modal-content { padding: 1.5rem; width: 95%; }
  form { gap: 1rem; }
  .checkbox-grid { grid-template-columns: 1fr; }
}
</style>