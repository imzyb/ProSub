import { reactive } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

// 创建一个响应式的全局对象
export const store = reactive({
  // 在这里存放所有需要全局共享的数据
  nodes: [],
  profiles: [],
  isLoading: true,
  error: null,

  // 创建一个方法来统一获取所有初始数据
  async fetchData() {
    this.isLoading = true;
    this.error = null;
    try {
      const [nodesRes, profilesRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/profiles'),
      ]);

      if (!nodesRes.ok || !profilesRes.ok) {
        throw new Error('从服务器获取核心数据失败。');
      }

      this.nodes = await nodesRes.json();
      this.profiles = await profilesRes.json();

    } catch (err) {
      this.error = err.message;
      // 使用 toast 进行错误提示，因为 store 中无法直接访问组件上下文
      // 注意：这里的 toast 可能不会立即生效，但错误会被记录
      toast.error(err.message || '获取数据时发生未知错误');
      console.error("Failed to fetch data for store:", err);
    } finally {
      this.isLoading = false;
    }
  },
});