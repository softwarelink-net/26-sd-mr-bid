<script setup>
import { onMounted, ref } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'
import { fetchRecords, recomputeHash, verifyCa } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/medical/StatusBadge.vue'

const auth = useAuthStore()
const keyword = ref('MR2026081401')
const result = ref(null)
const hashResult = ref(null)
const payload = ref('')
const loading = ref(false)

const canResign = () => auth.role === 'SUPER_ADMIN'

async function run() {
  loading.value = true
  try {
    result.value = await verifyCa(keyword.value)
    if (!result.value) {
      const row = await fetchRecords({ id: keyword.value })
      result.value = row
    }
  } finally {
    loading.value = false
  }
}

async function hashCheck() {
  hashResult.value = await recomputeHash({
    payload: payload.value || result.value?.mr_number,
    digital_hash: result.value?.digital_hash,
    mr_id: result.value?.id,
  })
}

onMounted(run)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold text-slate-800">CA 验签与数字指纹</h1>
      <p class="mt-1 text-sm text-slate-500">国密签名校验 · TSA 时间戳固化 · SHA-256 病案唯一指纹</p>
    </div>

    <div class="panel flex flex-wrap items-end gap-3 p-4">
      <label class="min-w-[240px] flex-1 text-xs text-slate-500">
        病案号 / ID
        <input v-model="keyword" class="input-light" />
      </label>
      <button class="btn-primary" :disabled="loading" @click="run">核验</button>
    </div>

    <div v-if="result" class="grid gap-4 lg:grid-cols-2">
      <section class="panel p-5">
        <div class="flex items-center gap-2">
          <ShieldCheck class="h-5 w-5 text-emerald-600" />
          <h3 class="font-semibold">验签结果</h3>
        </div>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">病案号</dt><dd class="font-mono">{{ result.mr_number }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">归档状态</dt><dd><StatusBadge :status="result.archive_status" /></dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">CA</dt><dd>{{ result.ca_sign_status ? '已验签' : '未签名' }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">指纹完整</dt><dd>{{ result.fingerprint_ok ? '通过' : '待固化' }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">TSA</dt><dd class="font-mono text-xs">{{ result.tsa_time || '—' }}</dd></div>
          <div>
            <dt class="text-slate-500">SHA-256</dt>
            <dd class="mt-1 break-all font-mono text-xs">{{ result.digital_hash || '尚未生成' }}</dd>
          </div>
        </dl>
        <p v-if="canResign()" class="mt-4 text-xs text-slate-400">超级管理员可在生产环境触发重签；演示环境仅校验哈希一致性。</p>
      </section>

      <section class="panel p-5">
        <h3 class="font-semibold">本地重算哈希</h3>
        <label class="mt-3 block text-xs text-slate-500">
          原文（病案号或 PDF/A 字节摘要）
          <textarea v-model="payload" rows="5" class="input-light" :placeholder="result.mr_number" />
        </label>
        <button class="btn-ghost mt-3" @click="hashCheck">计算并比对</button>
        <pre v-if="hashResult" class="mt-3 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{{ JSON.stringify(hashResult, null, 2) }}</pre>
      </section>
    </div>
  </div>
</template>
