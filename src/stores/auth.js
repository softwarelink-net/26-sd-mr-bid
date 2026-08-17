import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as apiLogin } from '@/api/client'
import { ROLE_LABELS, usePermissionStore } from '@/stores/permission'

const TOKEN_KEY = 'sdmr_token'
const USER_KEY = 'sdmr_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role || '')
  const roleLabel = computed(() => ROLE_LABELS[role.value] || role.value)
  const displayName = computed(() => user.value?.real_name || user.value?.username || '访客')
  const badgeNo = computed(() => user.value?.badge_no || 'NA')

  function hasRole(roles = []) {
    if (!roles.length) return true
    if (role.value === 'SUPER_ADMIN') return true
    return roles.includes(role.value)
  }

  function canAccessModule(moduleCode) {
    return usePermissionStore().canAccess(role.value, moduleCode)
  }

  async function login(username, password) {
    const res = await apiLogin(username, password)
    if (!res.success) throw new Error(res.error || '登录失败')
    token.value = res.token
    user.value = res.user
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    return res.user
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    role,
    roleLabel,
    displayName,
    badgeNo,
    hasRole,
    canAccessModule,
    login,
    logout,
  }
})
