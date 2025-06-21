<script setup>
import { ref, onMounted, watch } from 'vue';
import { parseNodeUrl } from '../utils.js';
import NodeDetailModal from '../components/NodeDetailModal.vue';

const nodes = ref([]);
const isLoading = ref(true);
const newNodeName = ref('');
const newNodeUrl = ref('');
const isDetailModalVisible = ref(false);
const selectedNodeForDetail = ref(null);

watch(newNodeUrl, (newUrl) => {
  if (newUrl && !newNodeName.value) {
    const details = parseNodeUrl(newUrl);
    if (details && details.name) {
      newNodeName.value = details.name;
    }
  }
});

async function fetchNodes() {
  isLoading.value = true;
  try {
    const response = await fetch('/api/nodes');
    if (!response.ok) throw new Error("从服务器获取节点数据失败。");
    nodes.value = await response.json();
  } catch (error) {
    console.error('获取节点失败:', error);
    alert('加载节点列表失败');
  } finally {
    isLoading.value = false;
  }
}

async function saveData(updatedNodes) {
    try {
        const response = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedNodes)
        });
        if (!response.ok) throw new Error('保存节点失败');
        return true;
    } catch (error) {
        console.error('保存节点失败:', error);
        alert('保存节点失败');
        return false;
    }
}

async function addNode() {
  if (!newNodeName.value.trim() || !newNodeUrl.value.trim()) {
    alert('名称和URL不能为空');
    return;
  }
  const newNode = { id: crypto.randomUUID(), name: newNodeName.value, url: newNodeUrl.value };
  const success = await saveData([...nodes.value, newNode]);
  if (success) {
      newNodeName.value = '';
      newNodeUrl.value = '';
      fetchNodes();
  }
}

async function deleteNode(id) {
  if (!confirm('确定要删除这个节点吗？')) return;
  const updatedNodes = nodes.value.filter(n => n.id !== id);
  if (await saveData(updatedNodes)) {
    fetchNodes();
  }
}

function showNodeDetails(node) {
  selectedNodeForDetail.value = parseNodeUrl(node.url);
  isDetailModalVisible.value = true;
}

function closeDetailModal() {
  isDetailModalVisible.value = false;
}

onMounted(fetchNodes);
</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>节点池 (Node Pool)</h2>
      <p class="card-description">在这里添加和管理您的所有节点，包括单个节点链接和远程订阅链接。</p>
      <form @submit.prevent="addNode">
        <input v-model="newNodeName" type="text" placeholder="节点或订阅名称" />
        <input v-model="newNodeUrl" type="text" placeholder="粘贴订阅链接或节点分享链接" />
        <button type="submit">添加节点/订阅</button>
      </form>
      <hr/>
      <div v-if="isLoading">正在加载节点...</div>
      <ul v-else-if="nodes.length > 0" class="item-list">
        <li v-for="node in nodes" :key="node.id">
          <span class="item-name"><strong>{{ node.name }}</strong></span>
          <div class="item-actions">
            <button @click="showNodeDetails(node)" class="btn-secondary">详情</button>
            <button @click="deleteNode(node.id)" class="btn-danger">删除</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">暂无节点，请添加您的第一个节点。</div>
    </div>

    <NodeDetailModal 
      :show="isDetailModalVisible" 
      :node="selectedNodeForDetail" 
      @close="closeDetailModal"
    />
  </div>
</template>

<style scoped>
/* 通用样式 */
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.card-description { font-size: 0.9rem; color: #666; margin-top: -0.5rem; margin-bottom: 1.5rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
form { display: flex; flex-direction: column; gap: 1rem; }
input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
button:hover { opacity: 0.9; }
button[type="submit"] { background-color: #007bff; }
.item-list { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #eee; }
li:last-child { border-bottom: none; }
.item-name { word-break: break-all; padding-right: 1rem; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-danger { background-color: #dc3545; }
.btn-secondary { background-color: #6c757d; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
</style>