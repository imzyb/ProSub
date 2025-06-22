<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js'; // 导入全局Store
import CustomRulesModal from '../components/CustomRulesModal.vue';

const toast = useToast();

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

const initialFormState = {
  id: null,
  name: '',
  outputFormat: 'Clash',
  nodeIds: [],
  selectedRuleSets: [],
  userCustomRulesString: '',
};

const formProfile = ref({ ...initialFormState });
const isEditing = computed(() => !!formProfile.value.id);
const showCustomRulesModal = ref(false);

// 【移除】不再需要本地的isLoading和fetchData

async function saveData(data) {
  const resource = isEditing.value ? `profiles/${formProfile.value.id}` : 'profiles';
  const method = isEditing.value ? 'PUT' : 'POST';
  
  const rulesArray = data.userCustomRulesString.split('\n').map(r => r.trim()).filter(Boolean);
  const payload = { ...data, userCustomRules: rulesArray };
  delete payload.userCustomRulesString;

  const body = isEditing.value ? payload : [...store.profiles, payload];

  try {
    const response = await fetch(`/api/${resource}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('保存配置失败');
    return true;
  } catch (error) {
    toast.error('保存配置失败');
    return false;
  }
}

async function saveProfile() {
  if (!formProfile.value.name.trim() || formProfile.value.nodeIds.length === 0) {
    toast.warning('配置名称不能为空，且至少要选择一个节点。');
    return;
  }
  const profileData = isEditing.value ? formProfile.value : { ...formProfile.value, id: crypto.randomUUID() };
  const success = await saveData(profileData);
  if (success) {
    toast.success(isEditing.value ? '配置更新成功！' : '配置创建成功！');
    resetForm();
    await store.fetchData();
  }
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
  try {
      const updatedProfiles = store.profiles.filter(p => p.id !== id);
      const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfiles)
      });
      if (!response.ok) throw new Error('删除配置失败');
      toast.success('配置删除成功！');
      await store.fetchData();
  } catch (e) {
      toast.error(e.message || '删除配置失败');
  }
}

function startEditProfile(profile) {
  const rulesString = Array.isArray(profile.userCustomRules) ? profile.userCustomRules.join('\n') : '';
  formProfile.value = { ...profile, selectedRuleSets: profile.selectedRuleSets || [], userCustomRulesString: rulesString };
  const formElement = document.getElementById('profile-form');
  if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  formProfile.value = { ...initialFormState };
}

const getSubscriptionLink = (profileId) => `${window.location.origin}/api/subscribe/${profileId}`;

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => toast.success('链接已复制到剪贴板！'));
}

// 【移除】onMounted钩子
</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>输出配置 (Profiles)</h2>
      <p class="card-description">在这里组合您的节点，生成可在客户端中使用的最终订阅链接。</p>
      <div v-if="store.isLoading">正在加载...</div>
      <ul v-else-if="store.profiles.length > 0" class="item-list">
        <li v-for="profile in store.profiles" :key="profile.id">
          <div class="profile-content">
            <div class="profile-details">
              <strong>{{ profile.name }}</strong>
              <span>格式: {{ profile.outputFormat }}</span>
            </div>
            <input class="link-input" :value="getSubscriptionLink(profile.id)" readonly />
          </div>
          <div class="item-actions">
            <button @click="copyLink(getSubscriptionLink(profile.id))" class="btn-success">复制</button>
            <button @click="startEditProfile(profile)" class="btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn-danger">删除</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">暂无输出配置。</div>
    </div>

    <div class="card" id="profile-form">
      <h2>{{ isEditing ? '编辑输出配置' : '创建新输出配置' }}</h2>
      <form @submit.prevent="saveProfile">
        <input v-model="formProfile.name" type="text" placeholder="配置名称 (例如: 家庭Clash)" required/>
        <select v-model="formProfile.outputFormat">
          <option>Clash</option>
          <option>V2Ray</option>
        </select>
        
        <fieldset>
            <legend>选择内置Clash规则集:</legend>
            <div class="checkbox-grid">
                <div v-for="ruleSet in availableRuleSets" :key="ruleSet.id" class="checkbox-item">
                    <input type="checkbox" :id="`ruleset-${ruleSet.id}`" :value="ruleSet.id" v-model="formProfile.selectedRuleSets">
                    <label :for="`ruleset-${ruleSet.id}`">{{ ruleSet.name }}</label>
                </div>
            </div>
        </fieldset>

        <div>
            <button type="button" @click="showCustomRulesModal = true" class="btn-secondary w-full">高级：编辑自定义规则</button>
        </div>

        <fieldset>
            <legend>选择要包含的节点:</legend>
            <div v-if="store.nodes.length > 0" class="checkbox-grid">
                <div v-for="node in store.nodes" :key="node.id" class="checkbox-item">
                  <input type="checkbox" :id="`node-sel-${node.id}`" :value="node.id" v-model="formProfile.nodeIds">
                  <label :for="`node-sel-${node.id}`">{{ node.name }}</label>
                </div>
            </div>
            <p v-else class="empty-state-small">请先在“节点管理”页面中添加节点。</p>
        </fieldset>

        <div class="form-actions">
            <button type="submit" :disabled="!formProfile.name || formProfile.nodeIds.length === 0">{{ isEditing ? '更新配置' : '创建配置' }}</button>
            <button v-if="isEditing" type="button" @click="resetForm" class="btn-secondary">取消编辑</button>
        </div>
      </form>
    </div>

    <CustomRulesModal 
        :show="showCustomRulesModal" 
        v-model:rules="formProfile.userCustomRulesString"
        @close="showCustomRulesModal = false"
        @save="(newRules) => { formProfile.userCustomRulesString = newRules }"
    />
  </div>
</template>

<style scoped>
/* 样式部分无需改动，保持原样即可 */
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 2rem; }
.card-description { font-size: 0.9rem; color: #666; margin-top: -0.5rem; margin-bottom: 1.5rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
.w-full { width: 100%; }
button:hover { opacity: 0.9; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
button[type="submit"] { background-color: #007bff; }
.item-list { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding: 1.5rem; border-bottom: 1px solid #eee; }
li:last-child { border-bottom: none; }
.profile-content { flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.profile-details { display: flex; align-items: center; gap: 1rem; }
.profile-details strong { font-size: 1.1rem; }
.profile-details span { font-size: 0.85rem; color: #666; background-color: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px;}
.link-input { width: 100%; background-color: #e9ecef; border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; font-family: monospace; font-size: 0.85rem; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-danger { background-color: #dc3545; }
.btn-success { background-color: #28a745; }
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-secondary { background-color: #6c757d; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
.empty-state-small { font-size: 0.9rem; color: #888; margin: 0; padding: 0.5rem;}
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
</style>