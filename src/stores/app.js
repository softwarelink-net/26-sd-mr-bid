import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const realtimeStatus = ref('ONLINE')
  const clientIp = ref('10.12.8.21')
  const notices = ref([
    { id: 1, title: '消化内科二区 1 份病案终检驳回：缺失知情同意书', time: '09:05', level: 'high' },
    { id: 2, title: '今日待 PDF/A 转换队列 17 份，自动封存已开启', time: '08:40', level: 'medium' },
    { id: 3, title: '科研借阅申请 1 条待病案科审批', time: '11:05', level: 'low' },
  ])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { sidebarCollapsed, realtimeStatus, clientIp, notices, toggleSidebar }
})
