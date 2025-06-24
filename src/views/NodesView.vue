<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import { parseNodeUrl } from '../utils.js';
import NodeEditorModal from '../components/NodeEditorModal.vue';
import BatchImportModal from '../components/BatchImportModal.vue';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const showEditorModal = ref(false);
const nodeToEdit = ref(null);
const showBatchImportModal = ref(false);
const isSavingNode = ref(false);
const deletingNodeId = ref(null);

function getProtocolInfo(nodeUrl) {
    const parsed = parseNodeUrl(nodeUrl);
    const protocol = parsed ? parsed.protocol.toUpperCase() : 'LINK';
    const styleMap = {
        VMESS: 'protocol-vmess', VLESS: 'protocol-vless', TROJAN: 'protocol-trojan',
        SS: 'protocol-ss', HYSTERIA2: 'protocol-hysteria2', HTTP: 'protocol-sub', HTTPS: 'protocol-sub',
    };
    return { text: protocol, style: styleMap[protocol] || 'protocol-unknown' };
}

function getNodeAddress(nodeUrl) {
    const parsed = parseNodeUrl(nodeUrl);
    return parsed ? (parsed.address || parsed.hostname || '') : 'N/A';
}

async function handleSaveNode(nodeData) {
  isSavingNode.value = true;
  store.isActionLoading = true;
  try {
    const isEditing = !!nodeData.id;
    if (!nodeData.name.trim() || !nodeData.url.trim()) {
      toast.warning('名称和URL不能为空'); return;
    }
    let response;
    if (isEditing) {
      const updatedNodes = store.nodes.map(n => n.id === nodeData.id ? nodeData : n);
      response = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedNodes) });
    } else {
      const newNode = { id: crypto.randomUUID(), ...nodeData };
      response = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([...store.nodes, newNode]) });
    }
    if (!response.ok) throw new Error('保存节点失败');
    toast.success(isEditing ? '节点更新成功！' : '节点添加成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    toast.error('保存节点失败');
  } finally {
    isSavingNode.value = false;
    store.isActionLoading = false;
  }
}

async function handleBatchSave(urls) {
    store.isActionLoading = true;
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
        store.isActionLoading = false;
    }
}

async function deleteNode(id) {
  if (!confirm('确定要删除这个节点吗？')) return;
  deletingNodeId.value = id;
  store.isActionLoading = true;
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
    store.isActionLoading = false;
  }
}

function openAddModal() { nodeToEdit.value = null; showEditorModal.value = true; }
function openEditModal(node) { nodeToEdit.value = { ...node }; showEditorModal.value = true; }
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <h1>节点管理</h1>
      <div class="header-actions">
        <button @click="showBatchImportModal = true" class="btn btn-outline-secondary">批量导入</button>
        <button @click="openAddModal" class="btn btn-primary">新增节点</button>
      </div>
    </header>
    
    <div class="content-card">
      <div v-if="store.isInitialLoading" class="loading-state">正在加载...</div>
      <div v-else-if="store.nodes.length > 0" class="table-container">
        <table class="node-table">
          <thead>
            <tr>
              <th class="col-type">类型</th>
              <th class="col-name">名称</th>
              <th class="col-address">地址</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in store.nodes" :key="node.id">
              <td>
                <span class="protocol-badge" :class="getProtocolInfo(node.url).style">
                  {{ getProtocolInfo(node.url).text }}
                </span>
              </td>
              <td class="node-name" :title="node.name">{{ node.name }}</td>
              <td class="node-address" :title="getNodeAddress(node.url)">{{ getNodeAddress(node.url) }}</td>
              <td class="actions-cell">
                <button @click="openEditModal(node)" class="btn-icon" title="编辑">✏️</button>
                <button @click="deleteNode(node.id)" class="btn-icon btn-danger" :disabled="deletingNodeId === node.id" title="删除">
                  <Spinner v-if="deletingNodeId === node.id" />
                  <span v-else>🗑️</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <h3>暂无节点</h3>
        <p>点击右上角“新增节点”或“批量导入”来开始。</p>
      </div>
    </div>

    <BatchImportModal :show="showBatchImportModal" @close="showBatchImportModal = false" @save="handleBatchSave" />
    <NodeEditorModal :show="showEditorModal" :node="nodeToEdit" :is-saving="isSavingNode" @close="showEditorModal = false" @save="handleSaveNode" />
  </div>
</template>

<style scoped>
.view-container { display: flex; flex-direction: column; height: 100%; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-shrink: 0; }
.view-header h1 { font-size: 1.75rem; font-weight: 600; }
.header-actions { display: flex; gap: 1rem; }
.content-card { flex-grow: 1; overflow-y: auto; padding: 0; }
.loading-state, .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); }
.table-container { overflow-x: auto; }
.node-table { width: 100%; border-collapse: collapse; }
.node-table th, .node-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.node-table th { font-weight: 600; font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; background-color: var(--color-background); }
.node-table tbody tr:hover { background-color: var(--color-background); }
.col-type { width: 120px; }
.col-name { max-width: 300px; overflow: hidden; text-overflow: ellipsis; }
.col-address { max-width: 400px; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary); }
.col-actions { width: 100px; text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 1rem; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.25rem; font-size: 1.1rem; opacity: 0.6; transition: opacity 0.2s; }
.btn-icon:hover { opacity: 1; }
.btn-icon.btn-danger:hover { color: var(--danger); }

.protocol-badge { font-size: 0.8rem; font-weight: 500; padding: 0.25rem 0.75rem; border-radius: 9999px; color: white; }
.protocol-vmess { background-color: #10b981; }
.protocol-vless { background-color: #3b82f6; }
.protocol-trojan { background-color: #ef4444; }
.protocol-ss { background-color: #f97316; }
.protocol-hysteria2 { background-color: #8b5cf6; }
.protocol-sub { background-color: #64748b; }
.protocol-unknown { background-color: #9ca3af; }
</style>