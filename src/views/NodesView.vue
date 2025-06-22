<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification'; // 【新增】导入 useToast
import { parseNodeUrl } from '../utils.js';
import NodeDetailModal from '../components/NodeDetailModal.vue';

const toast = useToast(); // 【新增】获取 toast 实例

const nodes = ref([]);
const isLoading = ref(true);

// 表单状态
const formNode = ref({ id: null, name: '', url: '' });

// 计算属性，判断当前是新增模式还是编辑模式
const isEditing = computed(() => !!formNode.value.id);

// 模态框状态
const isDetailModalVisible = ref(false);
const selectedNodeForDetail = ref(null);

// --- API 调用 ---
async function fetchNodes() {
  isLoading.value = true;
  try {
    const response = await fetch('/api/nodes');
    if (!response.ok) throw new Error("从服务器获取节点数据失败。");
    nodes.value = await response.json();
  } catch (error) {
    console.error('获取节点失败:', error);
    toast.error('加载节点列表失败'); // 【修改】替换 alert
  } finally {
    isLoading.value = false;
  }
}

async function saveNode() {
  if (!formNode.value.name.trim() || !formNode.value.url.trim()) {
    toast.warning('名称和URL不能为空'); // 【修改】替换 alert
    return;
  }

  try {
    let response;
    if (isEditing.value) {
      // 编辑模式: 使用PUT请求
      response = await fetch(`/api/nodes/${formNode.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formNode.value),
      });
    } else {
      // 新增模式: 使用POST请求
      const newNode = { id: crypto.randomUUID(), ...formNode.value };
      // 注意：我们的POST API现在是批量接口，所以发送整个数组
      response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...nodes.value, newNode]),
      });
    }

    if (!response.ok) throw new Error('保存节点失败');

    resetForm();
    await fetchNodes(); // 重新获取列表以刷新UI
    toast.error('保存节点失败'); // 【修改】替换 alert
  } catch (error) {
     console.error('保存节点失败:', error);
     toast.error('保存节点失败'); // 【修改】替换 alert
  }
}

async function deleteNode(id) {
  if (!confirm('确定要删除这个节点吗？')) return;
  try {
    const updatedNodes = nodes.value.filter(n => n.id !== id);
    const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNodes)
    });
    if (!response.ok) throw new Error('删除节点失败');
    await fetchNodes();
    toast.success('节点删除成功！'); // 【新增】成功提示
  } catch(e) {
    toast.error('删除节点失败'); // 【修改】替换 alert
  }
}

// --- 表单与模态框逻辑 ---
function startEdit(node) {
  // 将节点数据填充到表单中，进入编辑模式
  formNode.value = { ...node };
  // 滚动到表单位置，优化体验
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  // 重置表单，回到新增模式
  formNode.value = { id: null, name: '', url: '' };
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
      <h2>{{ isEditing ? '编辑节点' : '添加新节点' }}</h2>
      <form @submit.prevent="saveNode">
        <input v-model="formNode.name" type="text" placeholder="节点或订阅名称" />
        <input v-model="formNode.url" type="text" placeholder="粘贴订阅链接或节点分享链接" />
        <div class="form-actions">
          <button type="submit">{{ isEditing ? '更新节点' : '添加节点' }}</button>
          <button v-if="isEditing" type="button" @click="resetForm" class="btn-secondary">取消编辑</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>节点池 (Node Pool)</h2>
      <hr/>
      <div v-if="isLoading">正在加载节点...</div>
      <ul v-else-if="nodes.length > 0" class="item-list">
        <li v-for="node in nodes" :key="node.id">
          <span class="item-name"><strong>{{ node.name }}</strong></span>
          <div class="item-actions">
            <button @click="startEdit(node)" class="btn-warning">编辑</button>
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
/* ... 之前的CSS样式保持不变，新增/修改以下样式 ... */
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 2rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
form { display: flex; flex-direction: column; gap: 1rem; }
input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; }
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
.btn-warning { background-color: #ffc107; color: #212529; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
</style>