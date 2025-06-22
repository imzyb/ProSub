<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import CustomRulesModal from '../components/CustomRulesModal.vue';

const toast = useToast();
const nodes = ref([]);
const profiles = ref([]);
const isLoading = ref(true);

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

const initialFormState = {
  id: null,
  name: '',
  outputFormat: 'Clash',
  nodeIds: [],
  selectedRuleSets: [],
  userCustomRules: [], // 【修改】存储为数组
};

const formProfile = ref({ 
    ...initialFormState,
    userCustomRulesString: '', // 【新增】用于绑定textarea
});

// 3. 新增控制模态框的状态
const showCustomRulesModal = ref(false);

const isEditing = computed(() => !!formProfile.value.id);

// --- API 调用 ---
async function fetchData() {
  isLoading.value = true;
  try {
    const [nodesRes, profilesRes] = await Promise.all([
      fetch('/api/nodes'),
      fetch('/api/profiles')
    ]);
    if (!nodesRes.ok || !profilesRes.ok) throw new Error("从服务器获取数据失败。");
    nodes.value = await nodesRes.json();
    profiles.value = await profilesRes.json();
  } catch (error) {
    console.error('获取数据失败:', error);
    toast.error('加载数据列表失败');
  } finally {
    isLoading.value = false;
  }
}

async function saveData(data) {
  const resource = isEditing.value ? `profiles/${formProfile.value.id}` : 'profiles';
  const method = isEditing.value ? 'PUT' : 'POST';
  const body = isEditing.value ? data : [...profiles.value, data];

  try {
    const response = await fetch(`/api/${resource}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: '保存配置失败' }));
        throw new Error(errData.error || '保存配置失败');
    }
    return true;
  } catch (error) {
    console.error('保存配置失败:', error);
    toast.error(error.message);
    return false;
  }
}

async function saveProfile() {
  // 1. 验证表单输入
  if (!formProfile.value.name.trim() || formProfile.value.nodeIds.length === 0) {
    toast.warning('配置名称不能为空，且至少要选择一个节点。');
    return;
  }

  // 2. 准备要发送到后端的数据
  // 将textarea中的自定义规则字符串，处理成一个干净的数组
  const customRulesArray = formProfile.value.userCustomRulesString
    .split('\n')
    .map(r => r.trim())
    .filter(Boolean);

  // 构造最终的profile对象
  const profileData = { 
      ...formProfile.value, 
      userCustomRules: customRulesArray // 使用处理好的数组
  };
  
  // 删除临时的字符串属性，这个不需要保存到后端
  delete profileData.userCustomRulesString; 
  
  // 如果是新增模式，则添加一个新的UUID
  if (!isEditing.value) {
      profileData.id = crypto.randomUUID();
  }

  // 3. 调用通用的保存函数，它会自动判断是新增(POST)还是编辑(PUT)
  const success = await saveData(profileData);
  
  // 4. 如果保存成功，则重置表单并刷新列表
  if (success) {
    toast.success(isEditing.value ? '配置更新成功！' : '配置创建成功！');
    resetForm();
    await fetchData();
  }
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
  try {
      const updatedProfiles = profiles.value.filter(p => p.id !== id);
      const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfiles)
      });
      if (!response.ok) throw new Error('删除配置失败');
      toast.success('配置删除成功！');
      await fetchData();
  } catch (e) {
      toast.error(e.message || '删除配置失败');
  }
}

// --- 表单与工具方法 ---
function startEditProfile(profile) {
  const rulesString = Array.isArray(profile.userCustomRules) ? profile.userCustomRules.join('\n') : '';
  formProfile.value = { 
      ...profile, 
      selectedRuleSets: profile.selectedRuleSets || [],
      userCustomRulesString: rulesString, // 【新增】
  };
  const formElement = document.getElementById('profile-form');
  if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  formProfile.value = { ...initialFormState, userCustomRulesString: '' }; // 【修改】
}

const getSubscriptionLink = (profileId) => `${window.location.origin}/api/subscribe/${profileId}`;

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => toast.success('链接已复制到剪贴板！'));
}

onMounted(fetchData);
</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>输出配置 (Profiles)</h2>
      <p class="card-description">在这里组合您的节点，生成可在客户端中使用的最终订阅链接。</p>
      <div v-if="isLoading">正在加载...</div>
      <ul v-else-if="profiles.length > 0" class="item-list">
        <li v-for="profile in profiles" :key="profile.id">
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
            <div v-if="nodes.length > 0" class="checkbox-grid">
                <div v-for="node in nodes" :key="node.id" class="checkbox-item">
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
        :rules="formProfile.userCustomRulesString"
        @close="showCustomRulesModal = false"
        @save="(newRules) => { formProfile.userCustomRulesString = newRules }"
    />
  </div>
</template>

<style scoped>
/* 保持所有CSS样式与上一版本一致即可 */
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 2rem; }
.card-description { font-size: 0.9rem; color: #666; margin-top: -0.5rem; margin-bottom: 1.5rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
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
.empty-state-small { font-size: 0.9rem; color: #888; margin: 0; }
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
</style>