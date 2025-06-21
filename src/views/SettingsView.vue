<script setup>
import { ref, onMounted } from 'vue';

const nodes = ref([]);
const profiles = ref([]);
const fileInput = ref(null);

async function fetchData() {
    // 备份/恢复需要全部数据
    const [nodesRes, profilesRes] = await Promise.all([
      fetch('/api/nodes'),
      fetch('/api/profiles')
    ]);
    nodes.value = await nodesRes.json();
    profiles.value = await profilesRes.json();
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
        alert(`保存 ${resource} 失败`);
        return false;
    }
}

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
  if (confirm('警告：恢复操作将覆盖您当前的所有数据，是否继续？')) {
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
        alert('数据恢复成功！');
        fetchData(); // 刷新数据
      }
    } catch (error) {
      alert(`恢复失败: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

onMounted(fetchData);
</script>

<template>
  <div class="view-container">
    <div class="card">
        <h2>系统设置</h2>
        <p class="card-description">在这里进行系统级的操作，例如数据备份与恢复。</p>
        <div class="actions-wrapper">
          <button @click="backupData" class="action-btn backup-btn">备份所有数据</button>
          <button @click="triggerFileUpload" class="action-btn restore-btn">从文件恢复</button>
          <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".json" />
        </div>
    </div>
    </div>
</template>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.card-description { font-size: 0.9rem; color: #666; margin-top: -0.5rem; margin-bottom: 1.5rem; }
h2 { margin-top: 0; margin-bottom: 1rem; }
.actions-wrapper { display: flex; flex-direction: column; gap: 1rem; max-width: 400px; }
button { padding: 0.75rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; font-weight: 500; }
button:hover { opacity: 0.9; }
.backup-btn { background-color: #17a2b8; }
.restore-btn { background-color: #ffc107; color: #212529; }
</style>