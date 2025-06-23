// src/store.js
import { reactive } from 'vue';

export const store = reactive({
  // 数据状态
  nodes: [],
  profiles: [],
  
  // 页面级加载状态 (用于显示“正在加载...”)
  isInitialLoading: true,
  
  // 操作级加载状态 (用于显示全局遮罩)
  isActionLoading: false,

  // 统一的数据获取方法
  async fetchData() {
    this.isInitialLoading = true;
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
      // 只是抛出错误，让调用它的组件去处理UI提示
      console.error("Failed to fetch data for store:", err);
      throw err;
    } finally {
      this.isInitialLoading = false;
    }
  },
});