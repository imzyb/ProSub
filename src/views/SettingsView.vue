<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const fileInput = ref(null);

// 触发隐藏的文件输入框
function triggerFileUpload() {
  if (confirm('警告：恢复操作将覆盖您当前的所有节点和输出配置，并立即生效。是否继续？')) {
    fileInput.value.click();
  }
}

// 处理文件选择
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

      // 并行保存恢复的数据
      const savePromises = [
        fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restoredData.nodes)
        }),
        fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restoredData.profiles)
        })
      ];

      const responses = await Promise.all(savePromises);

      for (const response of responses) {
          if (!response.ok) {
              throw new Error('向服务器保存恢复数据时出错。');
          }
      }

      toast.success('数据恢复成功！页面将自动刷新以应用更改。');

      // 2秒后刷新页面，让用户看到提示
      setTimeout(() => {
          window.location.reload();
      }, 2000);

    } catch (error) {
      toast.error(`恢复失败: ${error.message}`);
    } finally {
        event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// 备份功能现在直接从API获取最新数据，不再依赖本页面的状态
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

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSaving = ref(false);

async function handleChangePassword() {
  if (!currentPassword.value || !newPassword.value) {
    toast.error('当前密码和新密码不能为空');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error('两次输入的新密码不一致');
    return;
  }
  
  isSaving.value = true;
  try {
    // 这里应该是调用后端的 /api/change-password 接口
    // 目前我们先用一个模拟的延时来演示效果
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 假设后端返回成功
    toast.success('密码修改成功！');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
  } catch (error) {
    toast.error('密码修改失败，请检查当前密码是否正确。');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <h2>系统设置</h2>
      <p class="card-description">在这里管理您的应用设置，例如修改登录密码。</p>
      
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
.view-container { max-width: 800px; margin: 0 auto; }
.card-description { border-top: 1px solid var(--color-border); padding-top: 1.5rem; margin-top: 1.5rem; color: var(--text-secondary); }
.settings-form { margin-top: 2rem; }
.form-section { display: flex; flex-direction: column; gap: 1.5rem; }
.section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
.form-group label { display: block; font-weight: 500; margin-bottom: 0.5rem; }
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 1rem;
}
.form-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}
</style>