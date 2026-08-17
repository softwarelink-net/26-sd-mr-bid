<script setup>
import { computed, onMounted, ref } from 'vue'
import { Play, RefreshCw, Fingerprint } from 'lucide-vue-next'
import { convertArchive, fetchArchiveQueue, fetchRecords } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import StatusBadge from '@/components/medical/StatusBadge.vue'

const auth = useAuthStore()
const perm = usePermissionStore()
const queue = ref([])
const selected = ref([])
const converting = ref(false)
const inspect = ref(null)
const log = ref([])

const canWrite = computed(() => perm.canWrite(auth.role, 'M2'))

async function load() {
  const rows = await fetchArchiveQueue()
  queue.value = Array.isArray(rows) ? rows : []
}

function toggle(id) {
  if (selected.value.includes(id)) selected.value = selected.value.filter((x) => x !== id)
  else selected.value = [...selected.value, id]
}

async function runConvert(ids) {
  if (!ids.length) return
  converting.value = true
  try {
    await convertArchive(ids)
    log.value.unshift({ t: new Date().toLocaleTimeString('zh-CN', { hour12: false }), msg: `已触发 PDF/A 转换 ${ids.length} 份，生成 SHA-256 指纹并排队 TSA` })
    selected.value = []
    await load()
  } finally {
    converting.value = false
  }
}

async function openInspect(row) {
  const fresh = await fetchRecords({ id: row.id })
  inspect.value = fresh || row
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">病案归档采集引擎</h1>
        <p class="mt-1 text-sm text-slate-500">监听 HIS/EMR 出院事件 · HTML/Word/CDA → PDF/A · CA 验签与数字指纹</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-ghost" @click="load">
          <RefreshCw class="h-4 w-4" /> 刷新队列
        </button>
        <button v-if="canWrite" class="btn-primary" :disabled="converting || !selected.length" @click="runConvert(selected)">
          <Play class="h-4 w-4" /> 批量转换 ({{ selected.length }})
        </button>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-4">
      <div class="panel p-4">
        <p class="label-muted">实时队列</p>
        <p class="stat-value mt-2">{{ queue.length }}</p>
        <p class="mt-1 text-xs text-slate-400">待转换 / 已转未入质控</p>
      </div>
      <div class="panel p-4 lg:col-span-3">
        <p class="label-muted">转换流水</p>
        <ul class="mt-2 max-h-20 space-y-1 overflow-auto text-xs text-slate-600">
          <li v-for="(item, i) in log" :key="i" class="font-mono">[{{ item.t }}] {{ item.msg }}</li>
          <li v-if="!log.length" class="text-slate-400">自动封存监听已开启，可手动单份或批量触发。</li>
        </ul>
      </div>
    </div>

    <section class="panel overflow-hidden">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="canWrite" class="w-10"></th>
              <th>病案号</th>
              <th>患者</th>
              <th>科室 / 主治</th>
              <th>出院时间</th>
              <th>状态</th>
              <th>页数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in queue" :key="row.id">
              <td v-if="canWrite">
                <input type="checkbox" :checked="selected.includes(row.id)" @change="toggle(row.id)" />
              </td>
              <td class="font-mono text-xs">{{ row.mr_number }}</td>
              <td>{{ row.patient_name }}</td>
              <td>{{ row.dept_name }} / {{ row.attending_doctor }}</td>
              <td class="whitespace-nowrap font-mono text-xs">{{ row.discharge_date }}</td>
              <td><StatusBadge :status="row.archive_status" /></td>
              <td>{{ row.page_count }}</td>
              <td class="space-x-2 whitespace-nowrap">
                <button v-if="canWrite && row.archive_status === 'PENDING_CONVERT'" class="text-xs text-primary-700" @click="runConvert([row.id])">单份转换</button>
                <button class="inline-flex items-center gap-1 text-xs text-slate-500" @click="openInspect(row)">
                  <Fingerprint class="h-3.5 w-3.5" /> 指纹
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="inspect" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="inspect = null">
      <div class="panel max-w-lg p-5">
        <h3 class="text-base font-semibold">数字签名与指纹核查</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-slate-500">病案号</dt><dd class="font-mono">{{ inspect.mr_number }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">CA 验签</dt><dd>{{ inspect.ca_sign_status ? '已验签' : '未签名' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">R2 路径</dt><dd class="truncate font-mono text-xs">{{ inspect.pdf_r2_url || '尚未生成' }}</dd></div>
          <div><dt class="text-slate-500">SHA-256</dt><dd class="mt-1 break-all font-mono text-xs">{{ inspect.digital_hash || '—' }}</dd></div>
        </dl>
        <button class="btn-ghost mt-4" @click="inspect = null">关闭</button>
      </div>
    </div>
  </div>
</template>
