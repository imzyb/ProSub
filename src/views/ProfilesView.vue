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

async function handleSaveProfile(formData) {
  isSavingProfile.value = true;
  store.isActionLoading = true;
  try {
    const isEditing = !!formData.id;
    if (!formData.name.trim()) {
      toast.warning('配置名称不能为空'); return;
    }
    const profileData = isEditing ? { ...formData } : { ...formData, id: crypto.randomUUID() };
    const resource = isEditing ? `profiles/${profileData.id}` : 'profiles';
    const method = isEditing ? 'PUT' : 'POST';
    const body = isEditing ? profileData : [...store.profiles, profileData];
    const response = await fetch(`/api/${resource}`, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('保存配置失败');
    toast.success(isEditing ? '配置更新成功！' : '配置创建成功！');
    showEditorModal.value = false;
    await store.fetchData();
  } catch (error) {
    toast.error('保存配置失败');
  } finally {
    isSavingProfile.value = false;
    store.isActionLoading = false;
  }
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
  deletingProfileId.value = id;
  store.isActionLoading = true;
  try {
    const updatedProfiles = store.profiles.filter(p => p.id !== id);
    const response = await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedProfiles) });
    if (!response.ok) throw new Error('删除配置失败');
    toast.success('配置删除成功！');
    await store.fetchData();
  } catch (e) {
    toast.error('删除配置失败');
  } finally {
    deletingProfileId.value = null;
    store.isActionLoading = false;
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
    <header class="view-header">
      <h1>输出配置</h1>
      <button @click="openAddModal" class="btn btn-primary">新增配置</button>
    </header>

    <div class="content-wrapper">
        <div v-if="store.isInitialLoading" class="loading-state">正在加载...</div>
        <div v-else-if="store.profiles.length > 0" class="profile-list">
        <div v-for="profile in store.profiles" :key="profile.id" class="profile-item card">
          <div class="profile-info">
            <strong class="profile-name">{{ profile.name }}</strong>
            <span class="profile-format">格式: {{ profile.outputFormat }}</span>
          </div>
          <input class="link-input" :value="getSubscriptionLink(profile.id)" readonly @click="$event.target.select()" />
          <div class="profile-actions">
            <button @click="copyLink(getSubscriptionLink(profile.id))" class="btn btn-success">复制</button>
            <button @click="openEditModal(profile)" class="btn btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn btn-danger" :disabled="deletingProfileId === profile.id">
              <Spinner v-if="deletingProfileId === profile.id" />
              <span v-else>删除</span>
            </button>
          </div>
        </div>
        </div>
        <div v-else class="empty-state">
            <h3>暂无输出配置</h3>
            <p>点击右上角“新增配置”来创建您的第一个作品。</p>
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
.view-container { display: flex; flex-direction: column; height: 100%; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-shrink: 0; }
.view-header h1 { font-size: 1.75rem; font-weight: 600; }
.content-wrapper { flex-grow: 1; overflow-y: auto; }
.loading-state, .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); }
.profile-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}
.profile-item {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.profile-info { display: flex; justify-content: space-between; align-items: center; }
.profile-name { font-size: 1.2rem; font-weight: 600; }
.profile-format { font-size: 0.85rem; color: var(--text-secondary); background-color: var(--color-background); padding: 0.2rem 0.5rem; border-radius: 4px;}
.link-input {
  width: 100%;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-primary);
}
.profile-actions {
  display: flex;
  gap: 0.75rem;
  align-self: flex-end;
  border-top: 1px solid var(--color-border);
  width: 100%;
  padding-top: 1rem;
  margin-top: 0.5rem;
}
</style>