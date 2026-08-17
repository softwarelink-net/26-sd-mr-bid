import { defineStore } from 'pinia'
import { computed } from 'vue'

export const ROLE_LABELS = {
  SUPER_ADMIN: '超级管理员',
  ARCHIVIST: '病案科质控员',
  CLINICIAN: '临床质控医师',
  RESEARCHER: '科研/借阅用户',
  AUDITOR: '外部审计员',
}

/**
 * RBAC matrix
 * M1 运营大屏 / M2 采集转换 / M3 质控 / M4 检索借阅 / M5 CA验签 / M6 系统审计
 */
export const MODULE_MATRIX = {
  SUPER_ADMIN: { M1: 'rw', M2: 'rw', M3: 'rw_review', M4: 'rw', M5: 'rw', M6: 'rw' },
  ARCHIVIST: { M1: 'read', M2: 'rw_retry', M3: 'rw_review', M4: 'rw', M5: 'read_verify', M6: 'read' },
  CLINICIAN: { M1: 'read_dept', M2: 'rw_init', M3: 'rw_dept', M4: 'read_dept', M5: 'none', M6: 'none' },
  RESEARCHER: { M1: 'none', M2: 'none', M3: 'none', M4: 'read_apply', M5: 'none', M6: 'none' },
  AUDITOR: { M1: 'read', M2: 'none', M3: 'read', M4: 'read_timed', M5: 'read', M6: 'read' },
}

export const ROUTE_MODULE = {
  dashboard: 'M1',
  archive: 'M2',
  qc: 'M3',
  borrow: 'M4',
  ca: 'M5',
  admin: 'M6',
}

export const usePermissionStore = defineStore('permission', () => {
  function accessOf(role, moduleCode) {
    return MODULE_MATRIX[role]?.[moduleCode] || 'none'
  }

  function canAccess(role, moduleCode) {
    if (!role) return false
    if (role === 'SUPER_ADMIN') return true
    return accessOf(role, moduleCode) !== 'none'
  }

  function canWrite(role, moduleCode) {
    const a = accessOf(role, moduleCode)
    return a.includes('rw') || a.includes('init') || a.includes('retry') || a.includes('dept')
  }

  function canReview(role, moduleCode) {
    return role === 'SUPER_ADMIN' || accessOf(role, moduleCode).includes('review')
  }

  function homeRoute(role) {
    if (role === 'RESEARCHER') return 'borrow'
    return 'dashboard'
  }

  const navCatalog = computed(() => [
    { name: 'dashboard', label: '运营监控大屏', module: 'M1' },
    { name: 'archive', label: '病案采集转换', module: 'M2' },
    { name: 'qc', label: '三级质控工作台', module: 'M3' },
    { name: 'borrow', label: '检索与安全借阅', module: 'M4' },
    { name: 'ca', label: 'CA验签与指纹', module: 'M5' },
    { name: 'admin', label: '系统设置与审计', module: 'M6' },
  ])

  return { accessOf, canAccess, canWrite, canReview, homeRoute, navCatalog }
})
