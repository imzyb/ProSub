import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard/nodes' // 默认跳转到节点管理
    },
    {
      path: '/dashboard',
      component: DashboardView,
      children: [
        {
          path: 'nodes',
          name: 'nodes',
          // 指向我们新的 NodesView 组件
          component: () => import('../views/NodesView.vue')
        },
        {
          path: 'profiles',
          name: 'profiles',
          // 指向我们新的 ProfilesView 组件
          component: () => import('../views/ProfilesView.vue')
        },
        {
            path: 'settings',
            name: 'settings',
            // 指向我们新的 SettingsView 组件
            component: () => import('../views/SettingsView.vue')
        }
      ]
    }
  ]
})

export default router