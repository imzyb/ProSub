<script setup>
import { ref, onMounted, computed } from 'vue';

// --- 状态 ---
const nodes = ref([]);
const profiles = ref([]);
const isLoading = ref(true);

// 将表单数据整合到一个响应式对象中，便于管理
const formProfile = ref({
  id: null,
  name: '',
  outputFormat: 'Clash',
  remoteConfig: '',
  nodeIds: [],
});

// 计算属性，判断当前是新增还是编辑模式
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

async function saveProfile() {
  if (!formProfile.value.name.trim() || formProfile.value.nodeIds.length === 0) {
    alert('配置名称不能为空，且至少要选择一个节点。');
    return;
  }

  try {
    let response;
    if (isEditing.value) {
      // 编辑模式: 使用 PUT 请求更新单个 profile
      response = await fetch(`/api/profiles/${formProfile.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formProfile.value),
      });
    } else {
      // 新增模式: 使用 POST 批量接口添加新 profile
      const newProfile = { ...formProfile.value, id: crypto.randomUUID() };
      response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...profiles.value, newProfile]),
      });
    }
    
    if (!response.ok) throw new Error('保存配置失败');

    resetForm();
    await fetchData();

  } catch (error) {
    console.error('保存配置失败:', error);
    alert('保存配置失败');
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
  // 将选中的profile数据填充到表单中，进入编辑模式
  formProfile.value = { ...profile };
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function resetForm() {
  formProfile.value = {
    id: null,
    name: '',
    outputFormat: 'Clash',
    remoteConfig: '',
    nodeIds: [],
  };
}

const getSubscriptionLink = (profileId) => `${window.location.origin}/subscribe/${profileId}`;

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
          <div class="profile-info">
            <strong>{{ profile.name }}</strong>
            <span>格式: {{ profile.outputFormat }}</span>
            <div class="link-wrapper">
              <input :value="getSubscriptionLink(profile.id)" readonly />
              <button @click="copyLink(getSubscriptionLink(profile.id))" class="btn-success">复制</button>
            </div>
          </div>
          <div class="item-actions">
            <button @click="startEditProfile(profile)" class="btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn-danger">删除</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">暂无输出配置。</div>
    </div>

    <div class="card">
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
/* 通用样式 */
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
li { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
li:last-child { border-bottom: none; }
.profile-info { display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; }
.link-wrapper { display: flex; margin-top: 0.5rem; }
.link-wrapper input { flex-grow: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; background-color: #e9ecef; }
.link-wrapper button { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-danger { background-color: #dc3545; }
.btn-success { background-color: #28a745; }
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-secondary { background-color: #6c757d; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
</style>