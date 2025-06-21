<script setup>
import { ref, onMounted } from 'vue';

const nodes = ref([]);
const profiles = ref([]);
const isLoading = ref(true);

const newProfileName = ref('');
const newProfileFormat = ref('Clash');
const newProfileRemoteConfig = ref('');
const selectedNodeIdsForNewProfile = ref([]);

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

async function saveData(updatedProfiles) {
    try {
        const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfiles)
        });
        if (!response.ok) throw new Error('保存配置失败');
        return true;
    } catch (error) {
        console.error('保存配置失败:', error);
        alert('保存配置失败');
        return false;
    }
}

async function addProfile() {
  if (!newProfileName.value.trim() || selectedNodeIdsForNewProfile.value.length === 0) {
    alert('配置名称不能为空，且至少要选择一个节点。');
    return;
  }
  const newProfile = {
    id: crypto.randomUUID(),
    name: newProfileName.value,
    nodeIds: selectedNodeIdsForNewProfile.value,
    outputFormat: newProfileFormat.value,
    remoteConfig: newProfileRemoteConfig.value,
  };
  const success = await saveData([...profiles.value, newProfile]);
  if (success) {
    newProfileName.value = '';
    newProfileRemoteConfig.value = '';
    selectedNodeIdsForNewProfile.value = [];
    fetchData();
  }
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
  const updatedProfiles = profiles.value.filter(p => p.id !== id);
  if (await saveData(updatedProfiles)) {
    fetchData();
  }
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
          <button @click="deleteProfile(profile.id)" class="btn-danger">删除</button>
        </li>
      </ul>
      <div v-else class="empty-state">暂无输出配置。</div>
    </div>

    <div class="card">
      <h2>创建新输出配置</h2>
      <form @submit.prevent="addProfile">
        <input v-model="newProfileName" type="text" placeholder="配置名称 (例如: 家庭Clash)" required/>
        <select v-model="newProfileFormat">
          <option>Clash</option>
          <option>V2Ray</option>
        </select>
        <input v-model="newProfileRemoteConfig" type="url" placeholder="（可选）远程配置链接 (如 Gist URL)" />
        <fieldset>
          <legend>选择要包含的节点:</legend>
          <div v-if="nodes.length > 0" class="checkbox-grid">
              <div v-for="node in nodes" :key="node.id" class="checkbox-item">
                <input type="checkbox" :id="`node-sel-${node.id}`" :value="node.id" v-model="selectedNodeIdsForNewProfile">
                <label :for="`node-sel-${node.id}`">{{ node.name }}</label>
              </div>
          </div>
          <p v-else>请先在“节点管理”页面中添加节点。</p>
        </fieldset>
        <button type="submit" :disabled="!newProfileName || selectedNodeIdsForNewProfile.length === 0">创建配置</button>
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
.btn-danger { background-color: #dc3545; }
.btn-success { background-color: #28a745; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
</style>