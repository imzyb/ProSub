// src/main.js
import './assets/main.css' // 确保这一行存在

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')