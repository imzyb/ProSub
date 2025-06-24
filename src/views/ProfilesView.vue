<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import ProfileEditorModal from '../components/ProfileEditorModal.vue';
import Spinner from '../components/Spinner.vue';

const toast = useToast();
const showEditorModal = ref(false);
const profileToEdit = ref(null);
const isSavingProfile = ref(false);
const deletingProfileId = ref(null);

async function handleSaveProfile(formData) {
  isSavingProfile.value = true;
  try {
    const isEditing = !!formData.id;
    if (!formData.name.trim()) {
      toast.warning('配置名称不能为空');
      return;
    }
    const profileData = isEditing ? { ...formData } : { ...formData, id: crypto.randomUUID() };
    
    const resource = isEditing ? `profiles/${profileData.id}` : 'profiles';
    const method = isEditing ? 'PUT' : 'POST';
    const body = isEditing ? profileData : [...store.profiles, profileData];

    const response = await fetch(`/api/${resource}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || '保存配置失败');
    }

    toast.success(isEditing ? '配置更新成功！' : '配置创建成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    toast.error(error.message);
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfiles),
    });
    if (!response.ok) throw new Error('删除配置失败');
    toast.success('配置删除成功！');
    await store.fetchData();
  } catch (e) {
    toast.error(e.message || '删除配置失败');
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

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    toast.success('链接已复制到剪贴板！');
  });
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <div class="card-header">
        <h2>输出配置 (Profiles)</h2>
        <button @click="openAddModal" class="btn btn-primary">新增配置</button>
      </div>
      <p class="card-description">在这里组合您的节点，生成可在客户端中使用的最终订阅链接。</p>

      <div v-if="store.isInitialLoading" class="loading-state">正在加载配置...</div>

      <ul v-else-if="store.profiles.length > 0" class="profile-list">
        <li v-for="profile in store.profiles" :key="profile.id" class="profile-item card">
          <div class="profile-info">
            <strong class="profile-name">{{ profile.name }}</strong>
            <span class="profile-format">格式: {{ profile.outputFormat }}</span>
          </div>
          <div class="profile-link">
            <input class="link-input" :value="getSubscriptionLink(profile.id)" readonly />
          </div>
          <div class="profile-actions">
            <button @click="copyLink(getSubscriptionLink(profile.id))" class="btn btn-success">复制</button>
            <button @click="openEditModal(profile)" class="btn btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn btn-danger" :disabled="deletingProfileId === profile.id">
              <Spinner v-if="deletingProfileId === profile.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </li>
      </ul>

      <div v-else class="empty-state">
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
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-description {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.loading-state, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); border: 2px dashed var(--color-border); border-radius: var(--border-radius); margin-top: 1rem; }
.profile-list {
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 【核心修改】使用Grid布局重新定义列表项 */
.profile-item {
  padding: 1.5rem;
  display: grid;
  /* 定义网格区域和列 */
  grid-template-areas:
    "info   actions"
    "link   actions";
  grid-template-columns: 1fr auto;
  gap: 1rem 1.5rem;
  align-items: center;
}

.profile-info { grid-area: info; display: flex; align-items: center; gap: 1rem; }
.profile-name { font-size: 1.2rem; font-weight: 600; }
.profile-format { font-size: 0.85rem; color: var(--text-secondary); background-color: var(--color-background); padding: 0.2rem 0.5rem; border-radius: 4px;}
.profile-link { grid-area: link; }
.link-input {
  width: 100%;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.profile-actions {
  grid-area: actions;
  display: flex;
  flex-direction: column; /* 让按钮垂直排列 */
  gap: 0.75rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-item {
    /* 在手机上，让按钮区域移动到下方 */
    grid-template-areas:
      "info"
      "link"
      "actions";
    grid-template-columns: 1fr;
  }
  .profile-actions {
    flex-direction: row; /* 按钮变为水平排列 */
    justify-content: flex-end; /* 靠右对齐 */
  }
}
</style>