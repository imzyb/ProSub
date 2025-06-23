<script setup>
import { ref, computed } from 'vue';
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
          <button @click="showBatchImportModal = true" class="btn-secondary">批量导入</button>
          <button @click="openAddModal" class="btn-primary">新增节点</button>
        </div>
      </div>
      <p class="card-description">在这里管理您的所有节点，包括单个节点链接和远程订阅链接。</p>
      
      <div v-if="store.isLoading" class="loading-text">正在加载节点...</div>
      
      <ul v-else-if="store.nodes.length > 0" class="node-list">
        <li v-for="item in store.nodes" :key="item.id" class="node-item">
          <div class="item-info">
            <span class="protocol-badge" :class="getProtocolInfo(item.url).style">
              {{ getProtocolInfo(item.url).text }}
            </span>
            <strong>{{ item.name }}</strong>
          </div>
          <div class="item-actions">
            <button @click="openEditModal(item)" class="btn-warning">编辑</button>
            <button @click="showNodeDetails(item)" class="btn-secondary">详情</button>
            <button @click="deleteNode(item.id)" class="btn-danger" :disabled="deletingNodeId === item.id">
              <Spinner v-if="deletingNodeId === item.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </li>
      </ul>

      <div v-else class="empty-state">
        <h3>空空如也</h3>
        <p>这里还没有任何节点或订阅。请添加您的第一个！</p>
        <button @click="openAddModal" class="btn-primary mt-4">新增节点</button>
      </div>
    </div>

    <BatchImportModal :show="showBatchImportModal" @close="showBatchImportModal = false" @save="handleBatchSave" />
    <NodeEditorModal :show="showEditorModal" :node="nodeToEdit" :is-saving="isSavingNode" @close="showEditorModal = false" @save="handleSaveNode" />
    <NodeDetailModal :show="showDetailModal" :node="selectedNodeForDetail" @close="closeDetailModal" />
  </div>
</template>

<style scoped>
/* 这里的样式是为 ul 和 v-for 设计的，是稳定版本 */
.view-container { max-width: 1280px; margin: 0 auto; }
.card { background: #fff; border-radius: 0.5rem; padding: 2rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07); border: 1px solid #e5e7eb; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.card-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
.header-actions { display: flex; gap: 1rem; flex-shrink: 0; }
.card-description { font-size: 0.9rem; color: #6b7280; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
.loading-text, .empty-state { text-align: center; padding: 3rem; color: #6b7280; border: 2px dashed #e5e7eb; border-radius: 0.5rem; margin-top: 1rem;}
.empty-state h3 { font-size: 1.1rem; color: #1f2937; margin: 0 0 0.5rem 0; }
.empty-state p { margin: 0 0 1rem 0; font-size: 0.9rem; }
.mt-4 { margin-top: 1rem; }
.node-list { list-style: none; padding: 0; margin-top: 1rem; }
.node-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #e5e7eb; }
.node-item:last-child { border-bottom: none; }
.item-info { display: flex; align-items: center; gap: 0.75rem; word-break: break-all; padding-right: 1rem; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
button { padding: 0.5rem 1rem; border-radius: 0.5rem; }
.protocol-badge { font-size: 0.75rem; font-weight: bold; padding: 0.2rem 0.6rem; border-radius: 9999px; flex-shrink: 0; color: white; }
.protocol-vmess { background-color: #10b981; }
.protocol-vless { background-color: #3b82f6; }
.protocol-trojan { background-color: #ef4444; }
.protocol-ss { background-color: #f97316; }
.protocol-hysteria2 { background-color: #8b5cf6; }
.protocol-sub { background-color: #64748b; }
.protocol-unknown { background-color: #9ca3af; }
@media (max-width: 768px) {
    .node-item { flex-direction: column; align-items: stretch; gap: 0.75rem; }
    .item-info { padding-right: 0; font-size: 0.9rem; }
    .item-actions { justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 0.75rem; margin-top: 0.5rem; }
    .card-header { flex-direction: column; align-items: stretch; gap: 1rem;}
    .header-actions { justify-content: space-between; }
}
</style>