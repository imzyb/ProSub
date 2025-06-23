<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import ProfileEditorModal from '../components/ProfileEditorModal.vue';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const showEditorModal = ref(false);
const profileToEdit = ref(null);
const isSavingProfile = ref(false);
const deletingProfileId = ref(null);

// 【新增】用于跟踪哪个链接刚被复制
const copiedProfileId = ref(null);

async function handleSaveProfile(formData) {
  isSavingProfile.value = true;
  try {
    const isEditing = !!formData.id;
    if (!formData.name.trim() || formData.nodeIds.length === 0) {
      toast.warning('配置名称不能为空，且至少要选择一个节点。'); return;
    }
    const profileData = isEditing ? { ...formData } : { ...formData, id: crypto.randomUUID() };
    const resource = isEditing ? `profiles/${profileData.id}` : 'profiles';
    const method = isEditing ? 'PUT' : 'POST';
    const body = isEditing ? profileData : [...store.profiles, profileData];

    const response = await fetch(`/api/${resource}`, {
      method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('保存配置失败');
    toast.success(isEditing ? '配置更新成功！' : '配置创建成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    toast.error('保存配置失败');
  } finally {
    isSavingProfile.value = false;
  }
}

async function deleteProfile(id) {
  if (deletingProfileId.value || !confirm('确定要删除这个输出配置吗？')) return;
  deletingProfileId.value = id;
  try {
    const updatedProfiles = store.profiles.filter(p => p.id !== id);
    const response = await fetch('/api/profiles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedProfiles)
    });
    if (!response.ok) throw new Error('删除配置失败');
    toast.success('配置删除成功！');
    await store.fetchData();
  } catch (e) {
    toast.error('删除配置失败');
  } finally {
    deletingProfileId.value = null;
  }
}

function openAddModal() {
  profileToEdit.value = null;
  showEditorModal.value = true;
}
function openEditModal(profile) {
  profileToEdit.value = { ...profile };
  showEditorModal.value = true;
}
const getSubscriptionLink = (profileId) => `${window.location.origin}/api/subscribe/${profileId}`;
// 【修改】copyLink 函数
function copyLink(link, profileId) {
  navigator.clipboard.writeText(link).then(() => {
    // toast.success('链接已复制到剪贴板！'); // 可以保留，也可以移除，因为有了即时反馈
    copiedProfileId.value = profileId; // 记录被复制的ID
    setTimeout(() => {
      if (copiedProfileId.value === profileId) {
        copiedProfileId.value = null; // 2秒后清除状态
      }
    }, 2000);
  });
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <div class="card-header">
        <h2>输出配置 (Profiles)</h2>
        <button @click="openAddModal" class="btn-primary">新增配置</button>
      </div>
      <p class="card-description">在这里组合您的节点，生成可在客户端中使用的最终订阅链接。</p>
      <hr />
      <div v-if="store.isLoading">正在加载...</div>
      <ul v-else-if="store.profiles.length > 0" class="item-list">
        <li v-for="profile in store.profiles" :key="profile.id">
          <div class="profile-content">
            <div class="profile-details">
              <strong>{{ profile.name }}</strong>
              <span>格式: {{ profile.outputFormat }}</span>
            </div>
            <input class="link-input" :value="getSubscriptionLink(profile.id)" readonly />
          </div>
          <div class="item-actions">
            <button @click="copyLink(getSubscriptionLink(profile.id), profile.id)" class="btn-success" :disabled="copiedProfileId === profile.id">
              <span v-if="copiedProfileId === profile.id">已复制!</span>
              <span v-else>复制</span>
            </button>
            <button @click="openEditModal(profile)" class="btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn-danger" :disabled="deletingProfileId === profile.id">
              <Spinner v-if="deletingProfileId === profile.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">
        <h3>暂无输出配置</h3>
        <p>请先创建您的第一个输出配置。</p>
        <button @click="openAddModal" class="btn-primary mt-4">新增配置</button>
      </div>
    </div>

    <ProfileEditorModal
      :show="showEditorModal"
      :profile="profileToEdit"
      :nodes="store.nodes"
      :is-saving="isSavingProfile"
      @close="showEditorModal = false"
      @save="handleSaveProfile"
    />
  </div>
</template>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.card { margin-bottom: 2rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { margin: 0; }
.card-description { font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem; margin-bottom: 1.5rem; }
form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-actions { display: flex; gap: 1rem; }

.item-list { list-style: none; padding: 0; margin-top: 1.5rem; }
li { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding: 1.5rem; border: 1px solid var(--color-border); border-radius: var(--border-radius); margin-bottom: 1rem;}
li:last-child { margin-bottom: 0; }
.profile-content { flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.profile-details { display: flex; align-items: center; gap: 1rem; }
.profile-details strong { font-size: 1.1rem; }
.profile-details span { font-size: 0.85rem; color: var(--text-secondary); background-color: var(--color-background); padding: 0.2rem 0.5rem; border-radius: 4px;}
.link-input { width: 100%; background-color: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 0.75rem; font-family: var(--font-mono); font-size: 0.85rem; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); border: 2px dashed var(--color-border); border-radius: var(--border-radius); }
.empty-state-small { font-size: 0.9rem; color: var(--text-secondary); margin: 0; padding: 0.5rem;}
fieldset { border: 1px solid var(--color-border); padding: 1rem; border-radius: var(--border-radius); }
legend { padding: 0 0.5rem; font-weight: 600; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; }

@media (max-width: 768px) {
  li { flex-direction: column; align-items: stretch; gap: 1rem; }
  .item-actions { justify-content: flex-end; }
}
</style>