<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const auth = useAuthStore()
const perm = usePermissionStore()
const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('Admin@2026')
const loading = ref(false)
const errorMsg = ref('')

const demos = [
  { label: '超级管理员', username: 'admin', password: 'Admin@2026' },
  { label: '病案质控员', username: 'archivist', password: 'Archive@2026' },
  { label: '临床医师', username: 'doctor', password: 'Doctor@2026' },
  { label: '科研借阅', username: 'researcher', password: 'Research@2026' },
  { label: '外部审计', username: 'auditor', password: 'Audit@2026' },
]

function fillDemo(d) {
  username.value = d.username
  password.value = d.password
}

async function submit() {
  errorMsg.value = ''
  loading.value = true
  try {
    const user = await auth.login(username.value, password.value)
    const fallback = perm.homeRoute(user.role)
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : { name: fallback })
  } catch (e) {
    errorMsg.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="panel space-y-5 p-6" @submit.prevent="submit">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">身份认证</h2>
      <p class="mt-1 text-xs text-slate-400">医疗 RBAC · JWT · CA 会话审计</p>
    </div>

    <div class="space-y-3">
      <label class="block text-xs text-slate-500">
        工号账号
        <input v-model="username" type="text" required class="input-light" autocomplete="username" />
      </label>
      <label class="block text-xs text-slate-500">
        密码
        <input v-model="password" type="password" required class="input-light" autocomplete="current-password" />
      </label>
    </div>

    <p v-if="errorMsg" class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
      {{ errorMsg }}
    </p>

    <button type="submit" class="btn-primary w-full" :disabled="loading">
      {{ loading ? '校验中…' : '登录控制台' }}
    </button>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="d in demos"
        :key="d.username"
        type="button"
        class="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:border-primary-400 hover:text-primary-700"
        @click="fillDemo(d)"
      >
        {{ d.label }}
      </button>
    </div>

    <div class="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
      <RouterLink to="/forgot-password" class="text-primary-600 hover:text-primary-500">忘记密码</RouterLink>
      <span class="font-mono text-slate-400">SDGP370000000202602007492</span>
    </div>
  </form>
</template>
