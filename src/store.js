import { reactive } from 'vue';
import { useToast } from 'vue-toastification';

export const store = reactive({
    nodes: [],
    profiles: [],
    isInitialLoading: true,

    async deleteNode(id) {
        this.isActionLoading = true;
        const toast = useToast();
        try {
            const updatedNodes = this.nodes.filter(n => n.id !== id);
            const response = await fetch('/api/nodes', { /* POST with updatedNodes */ });
            if (!response.ok) throw new Error('删除失败');
            toast.success('删除成功！');
            await this.fetchData(); // 成功后刷新数据
        } catch (e) {
            toast.error('删除失败');
        } finally {
            this.isActionLoading = false;
        }
    },


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