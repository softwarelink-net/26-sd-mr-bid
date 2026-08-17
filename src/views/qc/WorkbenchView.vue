<script setup>
import { computed, onMounted, ref } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { DEFECTS, fetchQc, submitQc } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import StatusBadge from '@/components/medical/StatusBadge.vue'
import SecurePdfPreviewer from '@/components/medical/SecurePdfPreviewer.vue'

const auth = useAuthStore()
const perm = usePermissionStore()
const records = ref([])
const history = ref([])
const current = ref(null)
const defect = ref(DEFECTS[0])
const comment = ref('')
const saving = ref(false)
const readOnly = computed(() => auth.role === 'AUDITOR')
const isFinal = computed(() => perm.canReview(auth.role, 'M3'))

async function load() {
  const data = await fetchQc()
  records.value = data.records || []
  history.value = data.history || []
  if (!current.value && records.value.length) current.value = records.value[0]
}

async function decide(result) {
  if (!current.value || readOnly.value) return
  saving.value = true
  try {
    await submitQc({
      mr_id: current.value.id,
      result,
      defect_type: result === 'REJECTED' ? defect.value : null,
      defect_comment: result === 'REJECTED' ? comment.value : '质控通过',
      level: isFinal.value ? 'ARCHIVE_LEVEL' : 'DEPT_LEVEL',
      qc_doctor_name: auth.displayName,
    })
    comment.value = ''
    await load()
    current.value = records.value.find((r) => r.id === current.value?.id) || records.value[0] || null
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold text-slate-800">三级病案质控闭环</h1>
      <p class="mt-1 text-sm text-slate-500">科室初检 → 病案室终检 → 缺陷驳回重修 → 归档封存上锁</p>
    </div>

    <div class="grid gap-4 xl:grid-cols-[280px_1fr_300px]">
      <section class="panel overflow-hidden">
        <div class="panel-header">待检队列</div>
        <ul class="max-h-[640px] divide-y divide-slate-100 overflow-auto">
          <li
            v-for="row in records"
            :key="row.id"
            class="cursor-pointer px-3 py-3 text-sm hover:bg-sky-50"
            :class="{ 'bg-sky-50': current?.id === row.id }"
            @click="current = row"
          >
            <p class="font-medium text-slate-800">{{ row.mr_number }} · {{ row.patient_name }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ row.dept_name }}</p>
            <StatusBadge class="mt-2" :status="row.archive_status" />
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <SecurePdfPreviewer :record="current" />
        <div v-if="current" class="panel p-4 text-sm">
          <p class="font-medium text-slate-800">{{ current.diagnosis_name }} <span class="font-mono text-xs text-slate-400">{{ current.icd10_code }}</span></p>
          <p class="mt-1 text-slate-500">{{ current.attending_doctor }} · {{ current.admission_date }} → {{ current.discharge_date }}</p>
        </div>
      </section>

      <section class="panel p-4">
        <h3 class="text-sm font-semibold text-slate-800">缺陷清单与处置</h3>
        <p class="mt-1 text-xs text-slate-400">当前层级：{{ isFinal ? '病案室终检' : '科室自查' }}</p>
        <label class="mt-4 block text-xs text-slate-500">
          缺陷类型
          <select v-model="defect" class="input-light" :disabled="readOnly">
            <option v-for="d in DEFECTS" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label class="mt-3 block text-xs text-slate-500">
          驳回说明
          <textarea v-model="comment" rows="4" class="input-light" :disabled="readOnly" placeholder="请描述缺项与补扫要求" />
        </label>
        <div v-if="!readOnly" class="mt-4 flex gap-2">
          <button class="btn-primary flex-1" :disabled="saving || !current" @click="decide('PASSED')">
            <Check class="h-4 w-4" /> 通过
          </button>
          <button class="btn-danger flex-1" :disabled="saving || !current" @click="decide('REJECTED')">
            <X class="h-4 w-4" /> 驳回重修
          </button>
        </div>
        <p v-else class="mt-4 text-xs text-slate-400">审计角色仅可调阅，不可改判。</p>

        <div class="mt-6 border-t border-slate-100 pt-3">
          <p class="text-xs font-semibold text-slate-500">最近质控记录</p>
          <ul class="mt-2 max-h-48 space-y-2 overflow-auto text-xs">
            <li v-for="h in history" :key="h.id" class="rounded-md bg-slate-50 p-2">
              <div class="flex items-center justify-between">
                <span>{{ h.mr_number }}</span>
                <StatusBadge kind="qc" :status="h.result" />
              </div>
              <p class="mt-1 text-slate-500">{{ h.qc_doctor_name }} · {{ h.defect_type || '无缺陷' }}</p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
