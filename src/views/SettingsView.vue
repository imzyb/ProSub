<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import Spinner from '../components/Spinner.vue';

const toast = useToast();

// 密码修改相关的状态
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSavingPassword = ref(false);

// 备份恢复相关的状态
const fileInput = ref(null);

// 模拟的修改密码函数
async function handleChangePassword() {
  if (!currentPassword.value || !newPassword.value) {
    toast.error('当前密码和新密码不能为空');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error('两次输入的新密码不一致');
    return;
  }
  
  isSavingPassword.value = true;
  try {
    // 在真实应用中，这里会调用后端的 /api/change-password 接口
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 假设后端返回成功
    toast.success('密码修改成功！');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
  } catch (error) {
    toast.error('密码修改失败，请检查当前密码是否正确。');
  } finally {
    isSavingPassword.value = false;
  }
}

// 触发文件上传
function triggerFileUpload() {
  if (confirm('警告：恢复操作将覆盖您当前的所有节点和输出配置，并立即生效。是否继续？')) {
    fileInput.value.click();
  }
}

// 处理文件选择和恢复
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const restoredData = JSON.parse(e.target.result);
      if (!Array.isArray(restoredData.nodes) || !Array.isArray(restoredData.profiles)) {
        throw new Error('无效的备份文件格式。');
      }

      // 我们需要一个统一的保存函数来调用
      const saveNodes = fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoredData.nodes)
      });
      const saveProfiles = fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoredData.profiles)
      });

      const responses = await Promise.all([saveNodes, saveProfiles]);

      for (const response of responses) {
        if (!response.ok) throw new Error('向服务器保存恢复数据时出错。');
      }
      
      toast.success('数据恢复成功！页面将自动刷新以应用更改。');
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      toast.error(`恢复失败: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// 备份功能
async function backupData() {
    toast.info("正在准备备份数据...");
    try {
        const [nodesRes, profilesRes] = await Promise.all([
            fetch('/api/nodes'),
            fetch('/api/profiles')
        ]);
        if (!nodesRes.ok || !profilesRes.ok) throw new Error("获取数据失败，无法备份。");

        const nodes = await nodesRes.json();
        const profiles = await profilesRes.json();

        if (nodes.length === 0 && profiles.length === 0) {
            toast.info('没有数据可备份。');
            return;
        }

        const backupObject = { nodes, profiles, timestamp: new Date().toISOString() };
        const jsonString = JSON.stringify(backupObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prosub_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

    } catch(e) {
        toast.error(e.message);
    }
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>系统操作</h2>
      <p class="card-description">在这里进行系统级的操作，例如数据备份与恢复。</p>
      <div class="actions-grid">
          <button @click="backupData" class="btn btn-secondary">备份所有数据</button>
          <button @click="triggerFileUpload" class="btn btn-warning">从文件恢复</button>
          <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".json" />
      </div>
    </div>

    <div class="card">
      <h2>安全设置</h2>
       <form @submit.prevent="handleChangePassword" class="settings-form">
        <div class="form-section">
          <h3 class="section-title">修改管理员密码</h3>
          <div class="form-group">
            <label for="current-password">当前密码</label>
            <input id="current-password" type="password" v-model="currentPassword" required />
          </div>
          <div class="form-group">
            <label for="new-password">新密码</label>
            <input id="new-password" type="password" v-model="newPassword" required />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认新密码</label>
            <input id="confirm-password" type="password" v-model="confirmPassword" required />
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <Spinner v-if="isSaving" />
            <span v-else>保存更改</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.view-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
.card-description { border-top: 1px solid var(--color-border); padding-top: 1.5rem; margin-top: 1.5rem; color: var(--text-secondary); }
.actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.settings-form { margin-top: 1rem; }
.form-section { display: flex; flex-direction: column; gap: 1rem; }
.section-title { font-size: 1.1rem; font-weight: 600; margin: 0; padding-bottom: 1rem; }
.form-group label { display: block; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.9rem; }
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: var(--border-radius);
  font-size: 1rem;
}
.form-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}
</style>