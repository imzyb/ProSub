import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard/nodes'
    },
    {
      path: '/dashboard',
      component: DashboardView,
      children: [
        {
          path: 'nodes',
          name: 'nodes',
          component: () => import('../views/NodesView.vue')
        },
        {
          path: 'profiles',
          name: 'profiles',
          component: () => import('../views/ProfilesView.vue')
        },
        {
            path: 'settings',
            name: 'settings',
            component: () => import('../views/SettingsView.vue')
        }
      ]
    }
  ]
})
export default router