<script setup>
// Script部分与我们最终的稳定版本完全相同，无需改动
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import { parseNodeUrl } from '../utils.js';
import NodeDetailModal from '../components/NodeDetailModal.vue';
import NodeEditorModal from '../components/NodeEditorModal.vue';
import BatchImportModal from '../components/BatchImportModal.vue';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const showEditorModal = ref(false);
const nodeToEdit = ref(null);
const showDetailModal = ref(false);
const selectedNodeForDetail = ref(null);
const isSavingNode = ref(false);
const deletingNodeId = ref(null);
const showBatchImportModal = ref(false);

async function handleSaveNode(nodeData) {
  isSavingNode.value = true;
  try {
    const isEditing = !!nodeData.id;
    if (!nodeData.name.trim() || !nodeData.url.trim()) {
      toast.warning('名称和URL不能为空'); return;
    }
    const headers = { 'Content-Type': 'application/json' };
    let response;
    if (isEditing) {
      response = await fetch(`/api/nodes/${nodeData.id}`, { method: 'PUT', headers, body: JSON.stringify(nodeData) });
    } else {
      const newNode = { id: crypto.randomUUID(), ...nodeData };
      response = await fetch('/api/nodes', { method: 'POST', headers, body: JSON.stringify([...store.nodes, newNode]) });
    }
    if (!response.ok) throw new Error('保存节点失败');
    toast.success(isEditing ? '节点更新成功！' : '节点添加成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    toast.error('保存节点失败');
  } finally {
    isSavingNode.value = false;
  }
}
async function handleBatchSave(urls) {
    isSavingNode.value = true;
    try {
        const newNodes = urls.map(url => {
            const parsed = parseNodeUrl(url);
            const name = parsed?.name || `未命名节点_${Date.now()}`;
            return { id: crypto.randomUUID(), name, url };
        });
        const updatedNodes = [...store.nodes, ...newNodes];
        const response = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedNodes) });
        if (!response.ok) throw new Error('批量导入失败');
        toast.success(`成功导入 ${newNodes.length} 个新节点！`);
        await store.fetchData();
    } catch(e) {
        toast.error('批量导入失败');
    } finally {
        isSavingNode.value = false;
    }
}
async function deleteNode(id) {
  if (deletingNodeId.value || !confirm('确定要删除这个节点吗？')) return;
  deletingNodeId.value = id;
  try {
    const updatedNodes = store.nodes.filter(n => n.id !== id);
    const response = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedNodes) });
    if (!response.ok) throw new Error('删除节点失败');
    toast.success('节点删除成功！');
    await store.fetchData();
  } catch (e) {
    toast.error('删除节点失败');
  } finally {
    deletingNodeId.value = null;
  }
}
function getProtocolInfo(nodeUrl) {
    const parsed = parseNodeUrl(nodeUrl);
    const protocol = parsed ? parsed.protocol : 'unknown';
    switch (protocol) {
        case 'vmess': return { text: 'VMESS', style: 'protocol-vmess' };
        case 'vless': return { text: 'VLESS', style: 'protocol-vless' };
        case 'trojan': return { text: 'TROJAN', style: 'protocol-trojan' };
        case 'ss': return { text: 'SS', style: 'protocol-ss' };
        case 'hysteria2': return { text: 'HY2', style: 'protocol-hysteria2' };
        case 'http': case 'https': return { text: 'SUB', style: 'protocol-sub' };
        default: return { text: 'LINK', style: 'protocol-unknown' };
    }
}
function openAddModal() { nodeToEdit.value = null; showEditorModal.value = true; }
function openEditModal(node) { nodeToEdit.value = { ...node }; showEditorModal.value = true; }
function showNodeDetails(node) { selectedNodeForDetail.value = parseNodeUrl(node.url); showDetailModal.value = true; }
function closeDetailModal() { showDetailModal.value = false; }
</script>

<template>
  <div class="view-container">
    <div class="card">
      <div class="card-header">
        <h2>节点池 (Node Pool)</h2>
        <div class="header-actions">
          <button @click="showBatchImportModal = true" class="btn btn-outline-secondary">批量导入</button>
          <button @click="openAddModal" class="btn btn-primary">新增节点</button>
        </div>
      </div>
      <p class="card-description">在这里管理您的所有节点，包括单个节点链接和远程订阅链接。</p>
      
      <div v-if="store.isInitialLoading" class="loading-state">正在加载节点...</div>
      
      <div v-else-if="store.nodes.length > 0" class="node-grid">
        <div v-for="item in store.nodes" :key="item.id" class="node-card">
          <div class="node-card-info">
            <span class="protocol-badge" :class="getProtocolInfo(item.url).style">{{ getProtocolInfo(item.url).text }}</span>
            <strong class="node-name" :title="item.name">{{ item.name }}</strong>
          </div>
          <div class="node-card-actions">
            <button @click="openEditModal(item)" class="btn btn-warning">编辑</button>
            <button @click="showNodeDetails(item)" class="btn btn-secondary">详情</button>
            <button @click="deleteNode(item.id)" class="btn btn-danger" :disabled="deletingNodeId === item.id">
              <Spinner v-if="deletingNodeId === item.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <h3>空空如也</h3>
        <p>这里还没有任何节点或订阅。请添加您的第一个！</p>
        <button @click="openAddModal" class="btn btn-primary" style="margin-top: 1rem;">新增节点</button>
      </div>
    </div>

    <BatchImportModal :show="showBatchImportModal" @close="showBatchImportModal = false" @save="handleBatchSave" />
    <NodeEditorModal :show="showEditorModal" :node="nodeToEdit" :is-saving="isSavingNode" @close="showEditorModal = false" @save="handleSaveNode" />
    <NodeDetailModal :show="showDetailModal" :node="selectedNodeForDetail" @close="closeDetailModal" />
  </div>
</template>

<style scoped>
.view-container {
  max-width: 1400px;
  margin: 0 auto;
}
.card {
  margin-bottom: 2rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.card-header h2 {
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}
.card-description {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  margin-top: 1rem;
  color: var(--text-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius);
}
.empty-state h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

/* 【核心】使用Grid网格布局 */
.node-grid {
  display: grid;
  /* 响应式网格：自动填充，每列最小350px，最大1fr */
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.node-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.node-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.node-card-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}
.node-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.node-card-actions .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
}

.protocol-badge {
  min-width: 60px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  color: white;
  flex-shrink: 0;
}
.protocol-vmess { background-color: #10b981; }
.protocol-vless { background-color: #3b82f6; }
.protocol-trojan { background-color: #ef4444; }
.protocol-ss { background-color: #f97316; }
.protocol-hysteria2 { background-color: #8b5cf6; }
.protocol-sub { background-color: #64748b; }
.protocol-unknown { background-color: #9ca3af; }
</style>