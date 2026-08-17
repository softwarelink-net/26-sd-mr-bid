import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guard'

const ALL = ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'RESEARCHER', 'AUDITOR']

const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { public: true, title: '登录' },
      },
    ],
  },
  {
    path: '/forgot-password',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { public: true, title: '找回密码' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '运营监控大屏', module: 'M1', roles: ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'AUDITOR'] },
      },
      {
        path: 'archive/ingest',
        name: 'archive',
        component: () => import('@/views/archive/IngestView.vue'),
        meta: { title: '病案采集与格式转换', module: 'M2', roles: ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN'] },
      },
      {
        path: 'qc/workbench',
        name: 'qc',
        component: () => import('@/views/qc/WorkbenchView.vue'),
        meta: { title: '三级质控工作台', module: 'M3', roles: ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'AUDITOR'] },
      },
      {
        path: 'borrow/search',
        name: 'borrow',
        component: () => import('@/views/borrow/SearchView.vue'),
        meta: { title: '病案检索与安全借阅', module: 'M4', roles: ALL },
      },
      {
        path: 'ca/verify',
        name: 'ca',
        component: () => import('@/views/ca/VerifyView.vue'),
        meta: { title: 'CA验签与数字指纹', module: 'M5', roles: ['SUPER_ADMIN', 'ARCHIVIST', 'AUDITOR'] },
      },
      {
        path: 'admin/audit',
        name: 'admin',
        component: () => import('@/views/admin/AuditView.vue'),
        meta: { title: '系统设置与操作审计', module: 'M6', roles: ['SUPER_ADMIN', 'ARCHIVIST', 'AUDITOR'] },
      },
      {
        path: '403',
        name: 'forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
        meta: { title: '无访问权限', public: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

setupGuards(router)

export default router
