import { reactive } from 'vue';
import { useToast } from 'vue-toastification';

export const store = reactive({
  nodes: [],
  profiles: [],
  isInitialLoading: true,

  async fetchData() {
    this.isInitialLoading = true;
    const toast = useToast();
    try {
      const [nodesRes, profilesRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/profiles'),
      ]);
      if (!nodesRes.ok || !profilesRes.ok) throw new Error('从服务器获取数据失败');
      this.nodes = await nodesRes.json();
      this.profiles = await profilesRes.json();
    } catch (err) {
      toast.error(err.message || '获取数据时发生未知错误');
    } finally {
      this.isInitialLoading = false;
    }
  },
});