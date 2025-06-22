<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import { parseNodeUrl } from '../utils.js';
import NodeDetailModal from '../components/NodeDetailModal.vue';
import NodeEditorModal from '../components/NodeEditorModal.vue';
import Spinner from '../components/Spinner.vue';

const toast = useToast();

// 控制模态框和加载状态
const showEditorModal = ref(false);
const nodeToEdit = ref(null);
const showDetailModal = ref(false);
const selectedNodeForDetail = ref(null);
const isSavingNode = ref(false);
const deletingNodeId = ref(null);

//【已清理】所有与分页相关的 ref (如 currentPage, paginatedNodes) 已被彻底移除

async function handleSaveNode(nodeData) {
  isSavingNode.value = true;
  try {
    const isEditing = !!nodeData.id;
    if (!nodeData.name.trim() || !nodeData.url.trim()) {
      toast.warning('名称和URL不能为空');
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    let response;

    if (isEditing) {
      response = await fetch(`/api/nodes/${nodeData.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(nodeData),
      });
    } else {
      const newNode = { id: crypto.randomUUID(), ...nodeData };
      response = await fetch('/api/nodes', {
        method: 'POST',
        headers,
        body: JSON.stringify([...store.nodes, newNode]),
      });
    }

    if (!response.ok) throw new Error('保存节点失败');
    toast.success(isEditing ? '节点更新成功！' : '节点添加成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    console.error('保存节点失败:', error);
    toast.error('保存节点失败');
  } finally {
    isSavingNode.value = false;
  }
}

async function deleteNode(id) {
  if (deletingNodeId.value || !confirm('确定要删除这个节点吗？')) return;
  deletingNodeId.value = id;
  try {
    const updatedNodes = store.nodes.filter(n => n.id !== id);
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedNodes),
    });
    if (!response.ok) throw new Error('删除节点失败');
    toast.success('节点删除成功！');
    await store.fetchData();
  } catch (e) {
    toast.error('删除节点失败');
  } finally {
    deletingNodeId.value = null;
  }
}

function openAddModal() {
  nodeToEdit.value = null;
  showEditorModal.value = true;
}

function openEditModal(node) {
  nodeToEdit.value = { ...node };
  showEditorModal.value = true;
}

function showNodeDetails(node) {
  selectedNodeForDetail.value = parseNodeUrl(node.url);
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <div class="card-header">
        <h2>节点池 (Node Pool)</h2>
        <button @click="openAddModal" class="btn-primary">新增节点</button>
      </div>
      <p class="card-description">在这里管理您的所有节点，包括单个节点链接和远程订阅链接。</p>
      <hr />
      <div v-if="store.isLoading" class="loading-text">正在加载节点...</div>
      
      <RecycleScroller
        v-else-if="store.nodes.length > 0"
        class="scroller"
        :items="store.nodes"
        :item-size="65"
        key-field="id"
        v-slot="{ item }"
      >
        <div class="node-item">
          <span class="item-name"><strong>{{ item.name }}</strong></span>
          <div class="item-actions">
            <button @click="openEditModal(item)" class="btn-warning">编辑</button>
            <button @click="showNodeDetails(item)" class="btn-secondary">详情</button>
            <button @click="deleteNode(item.id)" class="btn-danger" :disabled="deletingNodeId === item.id">
              <Spinner v-if="deletingNodeId === item.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </div>
      </RecycleScroller>
      
      <div v-else class="empty-state">暂无节点，请添加您的第一个节点。</div>
    </div>

    <NodeEditorModal
      :show="showEditorModal"
      :node="nodeToEdit"
      :is-saving="isSavingNode"
      @close="showEditorModal = false"
      @save="handleSaveNode"
    />
    <NodeDetailModal
      :show="showDetailModal"
      :node="selectedNodeForDetail"
      @close="closeDetailModal"
    />
  </div>
</template>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 2rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { margin: 0; }
.card-description { font-size: 0.9rem; color: #666; margin-top: 0.5rem; margin-bottom: 1.5rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
.loading-text, .empty-state { text-align: center; padding: 2rem; color: #888; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
button { padding: 0.6rem 1.2rem; color: white; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; font-weight: 500; min-width: 80px; text-align: center;}
button:disabled { cursor: not-allowed; opacity: 0.7; }
.btn-primary { background-color: #007bff; }
.btn-danger { background-color: #dc3545; }
.btn-secondary { background-color: #6c757d; }
.btn-warning { background-color: #ffc107; color: #212529; }
.scroller { height: 500px; overflow-y: auto; }
.node-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; height: 65px; }
.item-name { word-break: break-all; padding-right: 1rem; }
</style>