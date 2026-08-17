import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

export const permission = {
  mounted(el, binding) {
    apply(el, binding)
  },
  updated(el, binding) {
    apply(el, binding)
  },
}

function apply(el, binding) {
  const auth = useAuthStore()
  const perm = usePermissionStore()
  const value = binding.value
  let allowed = true
  if (typeof value === 'string') {
    allowed = perm.canAccess(auth.role, value)
  } else if (value && typeof value === 'object') {
    if (value.module) allowed = perm.canAccess(auth.role, value.module)
    if (value.write) allowed = allowed && perm.canWrite(auth.role, value.write)
    if (value.roles) allowed = allowed && auth.hasRole(value.roles)
  }
  if (!allowed) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}
