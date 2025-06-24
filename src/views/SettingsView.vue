<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const fileInput = ref(null);

async function backupData() {
  store.isActionLoading = true;
  toast.info("正在准备备份数据...");
  try {
      if (store.nodes.length === 0 && store.profiles.length === 0) {
        toast.info('没有数据可备份。');
        return;
      }
      const backupObject = { 
          nodes: store.nodes, 
          profiles: store.profiles, 
          timestamp: new Date().toISOString() 
      };
      const jsonString = JSON.stringify(backupObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prosub_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  } catch(e) {
      toast.error("备份准备失败。");
  } finally {
      store.isActionLoading = false;
  }
}

function triggerFileUpload() {
  if (confirm('警告：恢复操作将用文件中的数据【完全覆盖】您当前的所有节点和输出配置，此操作不可逆，是否继续？')) {
    fileInput.value.click();
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    store.isActionLoading = true;
    try {
      const restoredData = JSON.parse(e.target.result);
      if (!Array.isArray(restoredData.nodes) || !Array.isArray(restoredData.profiles)) {
        throw new Error('无效的备份文件格式。');
      }
      const savePromises = [
        fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restoredData.nodes) }),
        fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restoredData.profiles) })
      ];
      const responses = await Promise.all(savePromises);
      for (const response of responses) {
        if (!response.ok) throw new Error('向服务器保存恢复数据时出错。');
      }
      toast.success('数据恢复成功！正在重新加载...');
      setTimeout(() => store.fetchData(), 1500);
    } catch (error) {
      toast.error(`恢复失败: ${error.message}`);
    } finally {
      event.target.value = '';
      store.isActionLoading = false;
    }
  };
  reader.readAsText(file);
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <h1>系统设置</h1>
    </header>
    
    <div class="settings-grid">
        <div class="card">
            <h2>数据管理</h2>
            <p class="card-description">您可以将所有节点和输出配置备份到一个JSON文件中，或从备份文件中恢复。</p>
            <div class="actions-group">
              <button @click="backupData" class="btn btn-secondary">备份所有数据</button>
              <button @click="triggerFileUpload" class="btn btn-warning">从文件恢复</button>
              <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".json" />
            </div>
        </div>

        <div class="card">
            <h2>安全设置</h2>
            <p class="card-description">修改您的管理员登录密码。</p>
            <div class="info-group">
                <h4>修改密码说明</h4>
                <p>为保障安全，ProSub的管理员密码储存在Cloudflare的**环境变量**中，无法通过本界面直接修改。</p>
                <p>请登录您的Cloudflare控制台，找到对应的Pages项目，在 **设置 > 环境变量** 中，修改 `ADMIN_PASSWORD` 的值即可。</p>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { display: flex; flex-direction: column; height: 100%; }
.view-header { margin-bottom: 1.5rem; }
.view-header h1 { font-size: 1.75rem; font-weight: 600; }
.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 2rem;
}
.card-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}
.actions-group {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}
.info-group {
    background-color: var(--color-background);
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
}
.info-group h4 {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
}
.info-group p {
    color: var(--text-secondary);
    line-height: 1.6;
}
.info-group p:last-child {
    margin-top: 1rem;
}
</style>