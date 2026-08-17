import { useAuthStore } from '@/stores/auth'
import { ROUTE_MODULE, usePermissionStore } from '@/stores/permission'

const TITLE_BASE = '2026山一大附属消化病医院病案无纸化归档系统采购磋商'

export function setupGuards(router) {
  router.beforeEach((to, _from, next) => {
    const auth = useAuthStore()
    const perm = usePermissionStore()
    const isPublic = to.matched.some((r) => r.meta.public) || to.name === 'forbidden'
    const isAuthRoute = to.path === '/login' || to.path === '/forgot-password'

    const pageTitle = to.meta?.title
    document.title = pageTitle ? `${pageTitle} · ${TITLE_BASE}` : TITLE_BASE

    if (!auth.isAuthenticated && !isPublic && !isAuthRoute) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    if (auth.isAuthenticated && to.name === 'login') {
      return next({ name: perm.homeRoute(auth.role) })
    }

    if (auth.isAuthenticated && (to.path === '/' || to.name === 'dashboard') && !perm.canAccess(auth.role, 'M1')) {
      return next({ name: perm.homeRoute(auth.role) })
    }

    const moduleCode = to.meta.module || ROUTE_MODULE[to.name]
    if (moduleCode && auth.isAuthenticated && !perm.canAccess(auth.role, moduleCode)) {
      return next({ name: 'forbidden' })
    }

    const roles = to.meta.roles
    if (roles && auth.isAuthenticated && !auth.hasRole(roles)) {
      return next({ name: 'forbidden' })
    }

    return next()
  })
}
