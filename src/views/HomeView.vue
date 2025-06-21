<script setup>
import { ref, onMounted, watch } from 'vue';
import { parseNodeUrl } from '../utils.js';
import NodeDetailModal from '../components/NodeDetailModal.vue';

// --- 状态 ---
const nodes = ref([]);
const profiles = ref([]);
const isLoading = ref(true);
const fileInput = ref(null);

// 节点表单状态
const newNodeName = ref('');
const newNodeUrl = ref('');

// Profile表单状态
const newProfileName = ref('');
const newProfileFormat = ref('Clash');
const newProfileRemoteConfig = ref('');
const selectedNodeIdsForNewProfile = ref([]);

// 详情模态框状态
const isDetailModalVisible = ref(false);
const selectedNodeForDetail = ref(null);

// --- 自动填充节点名称 ---
watch(newNodeUrl, (newUrl) => {
  if (newUrl && !newNodeName.value) {
    const details = parseNodeUrl(newUrl);
    if (details && details.name) {
      newNodeName.value = details.name;
    }
  }
});

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
    alert('加载数据失败');
  } finally {
    isLoading.value = false;
  }
}

async function saveData(resource, data) {
    try {
        const response = await fetch(`/api/${resource}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`保存 ${resource} 失败`);
        return true;
    } catch (error) {
        console.error(`保存 ${resource} 失败:`, error);
        alert(`保存 ${resource} 失败`);
        return false;
    }
}

async function addNode() {
  if (!newNodeName.value.trim() || !newNodeUrl.value.trim()) {
    alert('名称和URL不能为空');
    return;
  }
  const newNode = { id: crypto.randomUUID(), name: newNodeName.value, url: newNodeUrl.value };
  const success = await saveData('nodes', [...nodes.value, newNode]);
  if (success) {
      newNodeName.value = '';
      newNodeUrl.value = '';
      fetchData();
  }
}

async function deleteNode(id) {
  if (!confirm('确定要删除这个节点吗？')) return;
  const updatedNodes = nodes.value.filter(n => n.id !== id);
  if (await saveData('nodes', updatedNodes)) {
    fetchData();
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
  const success = await saveData('profiles', [...profiles.value, newProfile]);
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
  if (await saveData('profiles', updatedProfiles)) {
    fetchData();
  }
}

// --- 备份与恢复 ---
function backupData() {
  if (nodes.value.length === 0 && profiles.value.length === 0) {
    alert('没有数据可备份。');
    return;
  }
  const backupObject = { nodes: nodes.value, profiles: profiles.value, timestamp: new Date().toISOString() };
  const jsonString = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prosub_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerFileUpload() {
  if (confirm('警告：恢复操作将覆盖您当前的所有节点和输出配置，是否继续？')) {
    fileInput.value.click();
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const restoredData = JSON.parse(e.target.result);
      if (!Array.isArray(restoredData.nodes) || !Array.isArray(restoredData.profiles)) {
        throw new Error('无效的备份文件格式。');
      }
      const nodesSaved = await saveData('nodes', restoredData.nodes);
      const profilesSaved = await saveData('profiles', restoredData.profiles);
      if (nodesSaved && profilesSaved) {
        alert('数据恢复成功！正在重新加载...');
        fetchData();
      }
    } catch (error) {
      alert(`恢复失败: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// --- 其他工具方法 ---
const getSubscriptionLink = (profileId) => `${window.location.origin}/subscribe/${profileId}`;
function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => alert('链接已复制到剪贴板！'));
}
function showNodeDetails(node) {
  selectedNodeForDetail.value = parseNodeUrl(node.url);
  isDetailModalVisible.value = true;
}
function closeDetailModal() {
  isDetailModalVisible.value = false;
}

onMounted(fetchData);
</script>

<template>
  <main class="container">
    <h1>ProSub - 统一管理平台</h1>

    <div class="card actions-card">
      <h2>系统操作</h2>
      <div class="actions-wrapper">
        <button @click="backupData" class="action-btn backup-btn">备份所有数据</button>
        <button @click="triggerFileUpload" class="action-btn restore-btn">从文件恢复</button>
        <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".json" />
      </div>
    </div>

    <div class="card">
      <h2>输出配置 (Profiles)</h2>
      <div v-if="isLoading">正在加载...</div>
      <ul v-else-if="profiles.length > 0" class="profile-list">
        <li v-for="profile in profiles" :key="profile.id">
          <div class="profile-info">
            <strong>{{ profile.name }}</strong>
            <span>格式: {{ profile.outputFormat }}</span>
            <div class="link-wrapper">
              <input :value="getSubscriptionLink(profile.id)" readonly />
              <button @click="copyLink(getSubscriptionLink(profile.id))" class="copy-btn">复制</button>
            </div>
          </div>
          <button @click="deleteProfile(profile.id)" class="delete-btn">删除</button>
        </li>
      </ul>
      <div v-else>暂无输出配置。</div>
    </div>

    <div class="card">
      <h2>创建新输出配置</h2>
      <form @submit.prevent="addProfile" class="profile-form">
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
          <p v-else>请先在下方的节点池中添加节点。</p>
        </fieldset>
        <button type="submit" :disabled="!newProfileName || selectedNodeIdsForNewProfile.length === 0">创建配置</button>
      </form>
    </div>

    <div class="card">
      <h2>节点池 (Node Pool)</h2>
      <form @submit.prevent="addNode">
        <input v-model="newNodeName" type="text" placeholder="节点或订阅名称" />
        <input v-model="newNodeUrl" type="text" placeholder="粘贴订阅链接或节点分享链接" />
        <button type="submit">添加节点/订阅</button>
      </form>
      <hr/>
      <div v-if="isLoading">正在加载...</div>
      <ul v-else-if="nodes.length > 0">
        <li v-for="node in nodes" :key="node.id">
          <span class="node-name"><strong>{{ node.name }}</strong></span>
          <div class="node-actions">
            <button @click="showNodeDetails(node)" class="detail-btn">详情</button>
            <button @click="deleteNode(node.id)" class="delete-btn">删除</button>
          </div>
        </li>
      </ul>
      <div v-else>暂无节点。</div>
    </div>

    <NodeDetailModal 
      :show="isDetailModalVisible" 
      :node="selectedNodeForDetail" 
      @close="closeDetailModal"
    />
  </main>
</template>

<style scoped>
/* 【修正】调整了容器最大宽度 */
.container { max-width: 1024px; margin: 2rem auto; padding: 1rem; font-family: sans-serif; }
.card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
h1, h2 { color: #333; }
h1 { margin-bottom: 2rem; text-align: center; font-size: 2rem; }
h2 { margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;}
hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
form, .profile-form { display: flex; flex-direction: column; gap: 1rem; }
input[type="text"], input[type="url"], select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
button:hover { opacity: 0.8; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
button[type="submit"] { background-color: #007bff; }
.delete-btn { background-color: #dc3545; }
.copy-btn { font-size: 0.8em; padding: 0.4rem 0.8rem; background-color: #28a745; }
.detail-btn { background-color: #6c757d; }

ul { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
li:last-child { border-bottom: none; }
.node-name { flex-grow: 1; word-break: break-all; padding-right: 1rem; }
.node-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

.profile-list li { flex-direction: row; align-items: center; gap: 1rem; }
.profile-info { display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; }
.link-wrapper { display: flex; }
.link-wrapper input { flex-grow: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; background-color: #e9ecef; }
.link-wrapper button { border-top-left-radius: 0; border-bottom-left-radius: 0; }

fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; }
legend { padding: 0 0.5rem; font-weight: bold; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }

.actions-card { background-color: #e9f5ff; }
.actions-wrapper { display: flex; gap: 1rem; }
.action-btn { flex-grow: 1; }
.backup-btn { background-color: #17a2b8; }
.restore-btn { background-color: #ffc107; color: #212529; }
</style>