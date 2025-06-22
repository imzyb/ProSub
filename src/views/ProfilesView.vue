<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { store } from '../store.js';
import ProfileEditorModal from '../components/ProfileEditorModal.vue';

const toast = useToast();
const showEditorModal = ref(false);
const profileToEdit = ref(null);

async function handleSaveProfile(formData) {
  const isEditing = !!formData.id;

  if (!formData.name.trim() || formData.nodeIds.length === 0) {
    toast.warning('配置名称不能为空，且至少要选择一个节点。');
    return;
  }

  const customRulesArray = []; // 自定义规则功能已移除，保留空数组
  const profileData = {
      ...formData,
      userCustomRules: customRulesArray,
  };

  if (!isEditing) {
      profileData.id = crypto.randomUUID();
  }

  const resource = isEditing ? `profiles/${profileData.id}` : 'profiles';
  const method = isEditing ? 'PUT' : 'POST';
  const body = isEditing ? profileData : [...store.profiles, profileData];

  try {
    const response = await fetch(`/api/${resource}`, {
      method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('保存配置失败');
    toast.success(isEditing ? '配置更新成功！' : '配置创建成功！');
    await store.fetchData();
  } catch (error) {
    toast.error('保存配置失败');
  }
}

async function deleteProfile(id) {
  if (!confirm('确定要删除这个输出配置吗？')) return;
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

const getSubscriptionLink = (profileId) => `<span class="math-inline">\{window\.location\.origin\}/api/subscribe/</span>{profileId}`;
function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => toast.success('链接已复制到剪贴板！'));
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
            <button @click="copyLink(getSubscriptionLink(profile.id))" class="btn-success">复制</button>
            <button @click="openEditModal(profile)" class="btn-warning">编辑</button>
            <button @click="deleteProfile(profile.id)" class="btn-danger">删除</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">暂无输出配置，请点击右上角“新增配置”来创建。</div>
    </div>

    <ProfileEditorModal
      :show="showEditorModal"
      :profile="profileToEdit"
      :nodes="store.nodes"
      @close="showEditorModal = false"
      @save="handleSaveProfile"
    />
  </div>
</template>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { margin: 0; }
.card-description { font-size: 0.9rem; color: #666; margin-top: 0.5rem; margin-bottom: 1.5rem; }
hr { border: none; border-top: 1px solid #eee; margin-top: 1.5rem; }
.item-list { list-style: none; padding: 0; margin-top: 1.5rem;}
li { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding: 1.5rem 0; border-bottom: 1px solid #eee; }
li:first-child { padding-top: 0; }
li:last-child { border-bottom: none; }
.profile-content { flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.profile-details { display: flex; align-items: center; gap: 1rem; }
.profile-details strong { font-size: 1.1rem; }
.profile-details span { font-size: 0.85rem; color: #666; background-color: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px;}
.link-input { width: 100%; background-color: #e9ecef; border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; font-family: monospace; font-size: 0.85rem; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
button { padding: 0.6rem 1.2rem; color: white; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; font-weight: 500;}
.btn-primary { background-color: #007bff; }
.btn-danger { background-color: #dc3545; }
.btn-success { background-color: #28a745; }
.btn-warning { background-color: #ffc107; color: #212529; }
.empty-state { text-align: center; padding: 2rem; color: #888; }
</style>