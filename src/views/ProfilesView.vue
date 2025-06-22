<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js'; // 导入全局Store
import CustomRulesModal from '../components/CustomRulesModal.vue';

const toast = useToast();

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

const formProfile = ref({ ...initialFormState, userCustomRulesString: '' });

const isEditing = computed(() => !!formProfile.value.id);

const showCustomRulesModal = ref(false);

async function saveData(data) {
  const resource = isEditing.value ? `profiles/${formProfile.value.id}` : 'profiles';
  const method = isEditing.value ? 'PUT' : 'POST';
  const body = isEditing.value ? data : [...store.profiles, data]; 

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
  if (success) {
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

</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>输出配置 (Profiles)</h2>
      <div v-if="store.isLoading">正在加载...</div>
      <ul v-else-if="store.profiles.length > 0" class="item-list">
        </ul>
      <div v-else class="empty-state">暂无输出配置。</div>
    </div>

    <div class="card" id="profile-form">
      <h2>{{ isEditing ? '编辑输出配置' : '创建新输出配置' }}</h2>
      <form @submit.prevent="saveProfile">
        <fieldset>
            <legend>选择要包含的节点:</legend>
            <div v-if="store.nodes.length > 0" class="checkbox-grid">
                <div v-for="node in store.nodes" :key="node.id" class="checkbox-item">
                  <input type="checkbox" :id="`node-sel-${node.id}`" :value="node.id" v-model="formProfile.nodeIds">
                  <label :for="`node-sel-${node.id}`">{{ node.name }}</label>
                </div>
            </div>
            </fieldset>
        </form>
    </div>
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