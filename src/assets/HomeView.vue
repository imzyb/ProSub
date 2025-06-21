<script setup>
import { ref, onMounted } from 'vue';

// 响应式状态
const nodes = ref([]);
const newNodeName = ref('');
const newNodeUrl = ref('');
const isLoading = ref(false);

// --- API 调用方法 ---

// 获取所有节点
async function fetchNodes() {
  isLoading.value = true;
  try {
    const response = await fetch('/api/nodes');
    nodes.value = await response.json();
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    alert('加载节点失败');
  } finally {
    isLoading.value = false;
  }
}

// 添加新节点
async function addNode() {
  if (!newNodeName.value.trim() || !newNodeUrl.value.trim()) {
    alert('名称和URL不能为空');
    return;
  }
  const newNode = {
    name: newNodeName.value,
    url: newNodeUrl.value,
  };

  try {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNode),
    });
    if (!response.ok) throw new Error('Failed to add node');

    // 清空输入框并重新加载列表
    newNodeName.value = '';
    newNodeUrl.value = '';
    fetchNodes(); 
  } catch (error) {
    console.error('Failed to add node:', error);
    alert('添加节点失败');
  }
}

// 删除节点
async function deleteNode(id) {
    if (!confirm('确定要删除这个节点吗？')) return;
  try {
    const response = await fetch(`/api/nodes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete node');

    fetchNodes(); // 重新加载列表
  } catch (error) {
    console.error('Failed to delete node:', error);
    alert('删除节点失败');
  }
}

// --- 生命周期钩子 ---
onMounted(() => {
  fetchNodes();
});
</script>

<template>
  <main class="container">
    <h1>ProSub - 节点管理</h1>

    <div class="card">
      <h2>添加新节点</h2>
      <form @submit.prevent="addNode">
        <input v-model="newNodeName" type="text" placeholder="节点或订阅名称" />
        <input v-model="newNodeUrl" type="url" placeholder="订阅链接或节点URL" />
        <button type="submit">添加</button>
      </form>
    </div>

    <div class="card">
      <h2>节点列表</h2>
      <div v-if="isLoading">正在加载...</div>
      <ul v-else-if="nodes.length > 0">
        <li v-for="node in nodes" :key="node.id">
          <span><strong>{{ node.name }}</strong>: {{ node.url }}</span>
          <button @click="deleteNode(node.id)" class="delete-btn">删除</button>
        </li>
      </ul>
      <div v-else>暂无节点，请添加一个。</div>
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