import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { permission } from './directives/permission'
import { initDatabase } from '@/db/engine'
import './assets/main.css'

async function bootstrap() {
  await initDatabase('/schema.sql')
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.directive('permission', permission)
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error(err)
  document.body.innerHTML = `<pre style="padding:2rem;color:#b91c1c">数据库初始化失败：${err.message}</pre>`
})
