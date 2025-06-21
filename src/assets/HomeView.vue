<script setup>
import { ref, onMounted, watch } from 'vue'; 
// 导入我们的新工具函数
import { extractNodeName } from '../utils.js';

// --- 状态 ---
const nodes = ref([]);
const profiles = ref([]); // 新增：管理输出配置
const isLoading = ref(true);

// 节点表单状态
const newNodeName = ref('');
const newNodeUrl = ref('');

// Profile表单状态
const newProfileName = ref('');
const newProfileFormat = ref('Clash'); // 默认输出格式
const selectedNodeIdsForNewProfile = ref([]);

// --- 自动填充节点名称 ---
watch(newNodeUrl, (newUrl) => {
  if (newUrl && !newNodeName.value) {
    const extracted = extractNodeName(newUrl);
    if (extracted) newNodeName.value = extracted;
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
    nodes.value = await nodesRes.json();
    profiles.value = await profilesRes.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    alert('加载数据失败');
  } finally {
    isLoading.value = false;
  }
}

async function addNode() {
  if (!newNodeName.value.trim() || !newNodeUrl.value.trim()) {
    alert('名称和URL不能为空');
    return;
  }
  const newNode = { name: newNodeName.value, url: newNodeUrl.value };
  await fetch('/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNode),
  });
  newNodeName.value = '';
  newNodeUrl.value = '';
  fetchData();
}

async function deleteNode(id) {
  if (!confirm('确定要删除这个节点吗？')) return;
  await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
  fetchData();
}

async function addProfile() {
  if (!newProfileName.value.trim() || selectedNodeIdsForNewProfile.value.length === 0) {
    alert('配置名称不能为空，且至少要选择一个节点。');
    return;
  }
  const newProfile = {
    name: newProfileName.value,
    nodeIds: selectedNodeIdsForNewProfile.value,
    outputFormat: newProfileFormat.value,
  };
  await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProfile),
  });
  newProfileName.value = '';
  selectedNodeIdsForNewProfile.value = [];
  fetchData();
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
  await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  fetchData();
}

// --- 工具方法 ---
const getSubscriptionLink = (profileId) => `<span class="math-inline">\{window\.location\.origin\}/subscribe/</span>{profileId}`;

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    alert('链接已复制到剪贴板！');
  }).catch(err => {
    console.error('Could not copy text: ', err);
    alert('复制失败');
  });
}
// --- 生命周期 ---
onMounted(fetchData);

function copyLink(elementId) {
    const input = document.getElementById(elementId);
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('链接已复制到剪贴板！');
    }
}

</script>

<template>
  <main class="container">
    <h1>ProSub - 统一管理平台</h1>

    <div class="card">
      <h2>输出配置 (Profiles)</h2>
      <div v-if="isLoading">正在加载...</div>
      <div v-else-if="profiles.length > 0">
        <ul class="profile-list">
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
      </div>
      <div v-else>暂无输出配置，请在下方创建。</div>
    </div>

    <div class="card">
      <h2>创建新输出配置</h2>
      <form @submit.prevent="addProfile" class="profile-form">
        <input v-model="newProfileName" type="text" placeholder="配置名称 (例如: 家庭Clash)" required/>
        <select v-model="newProfileFormat">
          <option>Clash</option>
        </select>
        <fieldset>
          <legend>选择要包含的节点:</legend>
          <div v-for="node in nodes" :key="node.id" class="checkbox-item">
            <input type="checkbox" :id="`node-sel-${node.id}`" :value="node.id" v-model="selectedNodeIdsForNewProfile">
            <label :for="`node-sel-${node.id}`">{{ node.name }}</label>
          </div>
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
          <span><strong>{{ node.name }}</strong>: {{ node.url.substring(0, 50) }}...</span>
          <button @click="deleteNode(node.id)" class="delete-btn">删除</button>
        </li>
      </ul>
      <div v-else>暂无节点。</div>
    </div>
  </main>
</template>

<style scoped>
/* 容器和卡片样式 */
.container { max-width: 800px; margin: 2rem auto; padding: 1rem; font-family: sans-serif; }
.card { background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
h1, h2 { color: #333; }
h1 { margin-bottom: 2rem; text-align: center; }
h2 { margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;}
hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }

/* 表单样式 */
form, .profile-form { display: flex; flex-direction: column; gap: 1rem; }
input[type="text"], input[type="url"], select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
button { padding: 0.75rem 1rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
button:hover { background-color: #0056b3; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
.delete-btn { background-color: #dc3545; }
.delete-btn:hover { background-color: #c82333; }
.copy-btn { font-size: 0.8em; padding: 0.4rem 0.8rem; background-color: #28a745; }
.copy-btn:hover { background-color: #218838; }

/* 列表样式 */
ul { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
li:last-child { border-bottom: none; }
.profile-list li { flex-direction: column; align-items: stretch; gap: 0.5rem; }
.profile-info { display: flex; flex-direction: column; gap: 0.5rem; }
.link-wrapper { display: flex; }
.link-wrapper input { flex-grow: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; background-color: #e9ecef; }
.link-wrapper button { border-top-left-radius: 0; border-bottom-left-radius: 0; }

/* Checkbox样式 */
fieldset { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; }
legend { padding: 0 0.5rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }
</style>