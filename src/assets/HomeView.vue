<script setup>
import { ref, onMounted } from 'vue';

// --- 状态 ---
const nodes = ref([]);
const profiles = ref([]); // 新增：管理输出配置
const isLoading = ref(true);

// 表单状态
const newNodeName = ref('');
const newNodeUrl = ref('');
const newProfileName = ref(''); // 新增
const selectedNodeIdsForNewProfile = ref([]); // 新增

// --- API 调用 ---

// 获取所有数据
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

// 添加节点
async function addNode() {
  // ... (此函数与上一阶段相同，为简洁省略) ...
}

// 删除节点
async function deleteNode(id) {
    // ... (此函数与上一阶段相同，为简洁省略) ...
}

// 新增：添加输出配置
async function addProfile() {
  if (!newProfileName.value.trim() || selectedNodeIdsForNewProfile.value.length === 0) {
    alert('配置名称不能为空，且至少要选择一个节点。');
    return;
  }
  const newProfile = {
    name: newProfileName.value,
    nodeIds: selectedNodeIdsForNewProfile.value,
    outputFormat: 'Clash', // 暂时硬编码
  };

  try {
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile),
    });
    newProfileName.value = '';
    selectedNodeIdsForNewProfile.value = [];
    fetchData(); // 重新加载所有数据
  } catch (error) {
    console.error('Failed to add profile:', error);
    alert('添加配置失败');
  }
}

// 新增：删除输出配置
async function deleteProfile(id) {
    if (!confirm('确定要删除这个输出配置吗？')) return;
    try {
        await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
        fetchData();
    } catch (error) {
        alert('删除配置失败');
    }
}

// --- 生命周期 ---
onMounted(fetchData);

const getSubscriptionLink = (profileId) => `<span class="math-inline">\{window\.location\.origin\}/subscribe/</span>{profileId}`;

</script>

<template>
  <main class="container">
    <h1>ProSub - 统一管理</h1>

    <div class="card">
      <h2>输出配置</h2>
      <div v-if="profiles.length > 0">
        <ul>
          <li v-for="profile in profiles" :key="profile.id">
            <div>
              <strong>{{ profile.name }}</strong>
              <input :value="getSubscriptionLink(profile.id)" readonly />
            </div>
            <button @click="deleteProfile(profile.id)" class="delete-btn">删除</button>
          </li>
        </ul>
      </div>
      <div v-else>暂无输出配置。</div>
    </div>

    <div class="card">
        <h2>创建新输出配置</h2>
        <form @submit.prevent="addProfile">
            <input v-model="newProfileName" type="text" placeholder="配置名称 (如: 家庭Clash)" />
            <fieldset>
                <legend>选择要包含的节点:</legend>
                <div v-for="node in nodes" :key="node.id">
                    <input type="checkbox" :id="`node-${node.id}`" :value="node.id" v-model="selectedNodeIdsForNewProfile">
                    <label :for="`node-${node.id}`">{{ node.name }}</label>
                </div>
            </fieldset>
            <button type="submit">创建配置</button>
        </form>
    </div>


    <div class="card">
      <h2>节点列表</h2>
      </div>

  </main>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
}
.card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}
li:last-child {
  border-bottom: none;
}
.delete-btn {
  background-color: #dc3545;
}
.delete-btn:hover {
    background-color: #c82333;
}
</style>