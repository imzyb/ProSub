<script setup>
// The <script setup> section remains exactly the same as the previous version.
// For brevity, it is not repeated here. Please keep your existing <script setup> block.
import { ref, onMounted, computed } from 'vue';

// --- 状态 ---
const nodes = ref([]);
const profiles = ref([]);
const isLoading = ref(true);

const formProfile = ref({
  id: null,
  name: '',
  outputFormat: 'Clash',
  remoteConfig: '',
  nodeIds: [],
});

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
    alert('加载数据列表失败');
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
    if (!response.ok) throw new Error('保存配置失败');
    return true;
  } catch (error) {
    console.error('保存配置失败:', error);
    alert('保存配置失败');
    return false;
  }
}

async function saveProfile() {
  if (!formProfile.value.name.trim() || formProfile.value.nodeIds.length === 0) {
    alert('配置名称不能为空，且至少要选择一个节点。');
    return;
  }

  const profileData = isEditing.value ? formProfile.value : { ...formProfile.value, id: crypto.randomUUID() };
  const success = await saveData(profileData);
  
  if (success) {
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
      await fetchData();
  } catch (e) {
      alert('删除配置失败');
  }
}

// --- 表单与工具方法 ---
function startEditProfile(profile) {
  formProfile.value = { ...profile };
  const formElement = document.getElementById('profile-form');
  if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
  }
}

function resetForm() {
  formProfile.value = { id: null, name: '', outputFormat: 'Clash', remoteConfig: '', nodeIds: [] };
}

// 正确的版本
const getSubscriptionLink = (profileId) => `${window.location.origin}/api/subscribe/${profileId}`;
function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => alert('链接已复制到剪贴板！'));
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
        <input v-model="formProfile.remoteConfig" type="url" placeholder="（可选）远程配置链接 (如 Gist URL)" />
        <fieldset>
          <legend>选择要包含的节点:</legend>
          <div v-if="nodes.length > 0" class="checkbox-grid">
              <div v-for="node in nodes" :key="node.id" class="checkbox-item">
                <input type="checkbox" :id="`node-sel-${node.id}`" :value="node.id" v-model="formProfile.nodeIds">
                <label :for="`node-sel-${node.id}`">{{ node.name }}</label>
              </div>
          </div>
          <p v-else>请先在“节点管理”页面中添加节点。</p>
        </fieldset>
        <div class="form-actions">
            <button type="submit" :disabled="!formProfile.name || formProfile.nodeIds.length === 0">{{ isEditing ? '更新配置' : '创建配置' }}</button>
            <button v-if="isEditing" type="button" @click="resetForm" class="btn-secondary">取消编辑</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* ... 其他样式保持不变，主要修改与列表项布局相关的CSS ... */
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 2rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
.card-description { font-size: 0.9rem; color: #666; margin-top: -0.5rem; margin-bottom: 1.5rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
button:hover { opacity: 0.9; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
button[type="submit"] { background-color: #007bff; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }

/* 【布局修改】 */
.item-list { list-style: none; padding: 0; }
li {
  display: flex;
  justify-content: space-between;
  align-items: flex-end; /* 将 center 修改为 flex-end */
  gap: 1.5rem;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}
li:last-child { border-bottom: none; }

.profile-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.profile-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.profile-details strong { font-size: 1.1rem; }
.profile-details span { font-size: 0.85rem; color: #666; background-color: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px;}

.link-input { /* 从 link-wrapper 中解放出来的 input */
    width: 100%;
    background-color: #e9ecef; 
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem; 
    font-family: monospace; 
    font-size: 0.85rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.btn-danger { background-color: #dc3545; }
.btn-success { background-color: #28a745; }
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-secondary { background-color: #6c757d; }
</style>