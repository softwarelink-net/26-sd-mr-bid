<script setup>
import { RouterLink } from 'vue-router'
import { ShieldOff } from 'lucide-vue-next'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const perm = usePermissionStore()
</script>

<template>
  <div class="mx-auto max-w-lg py-16 text-center">
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <ShieldOff class="h-7 w-7" />
    </div>
    <h1 class="text-xl font-semibold text-slate-800">403 · 当前角色无权访问该模块</h1>
    <p class="mt-2 text-sm text-slate-500">
      系统已按医疗 RBAC 矩阵拦截。科研借阅账号仅可申请限时调阅；临床医师仅可见本科室病案。
    </p>
    <RouterLink :to="{ name: perm.homeRoute(auth.role) }" class="btn-primary mt-6">返回工作台</RouterLink>
  </div>
</template>
