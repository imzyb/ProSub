// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// 【新增】导入虚拟滚动库及其CSS
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import './assets/main.css'

const app = createApp(App)

app.use(router)

// 【新增】将 Toast 插件注册到Vue应用中，并进行配置
app.use(Toast, {
  position: POSITION.TOP_RIGHT, // 通知默认出现在右上角
  timeout: 3000,                // 3秒后自动消失
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
})

app.use(VueVirtualScroller)

app.mount('#app')