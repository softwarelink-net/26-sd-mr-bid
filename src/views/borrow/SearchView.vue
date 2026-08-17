<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { DEPTS, applyBorrow, fetchBorrows, fetchRecords, reviewBorrow } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/medical/StatusBadge.vue'
import SecurePdfPreviewer from '@/components/medical/SecurePdfPreviewer.vue'

const auth = useAuthStore()
const list = ref([])
const borrows = ref([])
const preview = ref(null)
const applyOpen = ref(false)
const form = reactive({ q: '', dept: '', icd: '', doctor: '', date: '' })
const applyForm = reactive({ purpose: 'TEACHING_RESEARCH', days: 7 })

const canApprove = computed(() => auth.role === 'SUPER_ADMIN' || auth.role === 'ARCHIVIST')
const clinicianDept = computed(() => (auth.role === 'CLINICIAN' ? auth.user?.department : ''))

const filtered = computed(() => {
  return list.value.filter((r) => {
    if (clinicianDept.value && r.dept_name !== clinicianDept.value) return false
    const blob = `${r.mr_number}${r.patient_name}${r.icd10_code}${r.diagnosis_name}${r.attending_doctor}${r.dept_name}`
    if (form.q && !blob.includes(form.q)) return false
    if (form.dept && r.dept_name !== form.dept) return false
    if (form.icd && !`${r.icd10_code}${r.diagnosis_name}`.includes(form.icd)) return false
    if (form.doctor && !r.attending_doctor.includes(form.doctor)) return false
    if (form.date && !String(r.discharge_date).startsWith(form.date)) return false
    return true
  })
})

async function load() {
  list.value = (await fetchRecords()) || []
  borrows.value = (await fetchBorrows()) || []
}

async function submitApply() {
  if (!preview.value) return
  await applyBorrow({
    mr_id: preview.value.id,
    purpose: applyForm.purpose,
    days: applyForm.days,
    applicant_id: auth.user?.id,
    applicant_name: auth.displayName,
    watermark_text: `山一大消化病医院-工号:${auth.badgeNo}`,
  })
  applyOpen.value = false
  await load()
}

async function decide(id, status) {
  await reviewBorrow(id, status)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold text-slate-800">数字病案借阅与利用</h1>
      <p class="mt-1 text-sm text-slate-500">多维检索 · 动态水印阅读器 · 分级审批与到期自动回收</p>
    </div>

    <div class="panel flex flex-wrap items-end gap-3 p-3">
      <label class="min-w-[180px] flex-1 text-xs text-slate-500">
        综合检索
        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input v-model="form.q" class="input-light pl-9" placeholder="病案号 / 姓名 / ICD-10 / 医师" />
        </div>
      </label>
      <label class="w-40 text-xs text-slate-500">
        科室
        <select v-model="form.dept" class="input-light" :disabled="!!clinicianDept">
          <option value="">全部</option>
          <option v-for="d in DEPTS" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <label class="w-36 text-xs text-slate-500">出院诊断
        <input v-model="form.icd" class="input-light" placeholder="ICD-10" />
      </label>
      <label class="w-32 text-xs text-slate-500">主刀/主治
        <input v-model="form.doctor" class="input-light" />
      </label>
      <label class="w-40 text-xs text-slate-500">出院日期
        <input v-model="form.date" type="date" class="input-light" />
      </label>
    </div>

    <section class="panel overflow-hidden">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>病案号</th>
              <th>患者</th>
              <th>科室</th>
              <th>主治</th>
              <th>诊断</th>
              <th>出院</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.id">
              <td class="font-mono text-xs">{{ row.mr_number }}</td>
              <td>{{ row.patient_name }}</td>
              <td>{{ row.dept_name }}</td>
              <td>{{ row.attending_doctor }}</td>
              <td>{{ row.icd10_code }} {{ row.diagnosis_name }}</td>
              <td class="whitespace-nowrap font-mono text-xs">{{ row.discharge_date }}</td>
              <td><StatusBadge :status="row.archive_status" /></td>
              <td class="whitespace-nowrap">
                <button class="text-xs text-primary-700" @click="preview = row">安全阅读</button>
                <button v-permission="'M4'" class="ml-2 text-xs text-slate-500" @click="preview = row; applyOpen = true">申请借阅</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel overflow-hidden">
      <div class="panel-header">借阅审批与权限回收</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>申请单</th>
              <th>病案</th>
              <th>申请人</th>
              <th>用途</th>
              <th>有效期</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in borrows" :key="b.id">
              <td class="font-mono text-xs">{{ b.id }}</td>
              <td>{{ b.mr_number }} {{ b.patient_name }}</td>
              <td>{{ b.applicant_name }}</td>
              <td><StatusBadge kind="borrow" :status="b.purpose" /></td>
              <td class="font-mono text-xs">{{ b.start_time || '—' }} → {{ b.end_time || '—' }}</td>
              <td><StatusBadge kind="borrow" :status="b.status" /></td>
              <td v-if="canApprove && b.status === 'PENDING'" class="space-x-2">
                <button class="text-xs text-emerald-700" @click="decide(b.id, 'APPROVED')">批准</button>
                <button class="text-xs text-rose-600" @click="decide(b.id, 'REJECTED')">驳回</button>
              </td>
              <td v-else></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="preview" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" @click.self="preview = null; applyOpen = false">
      <div class="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">安全阅读器 · {{ preview.mr_number }}</h3>
          <button class="btn-ghost" @click="preview = null; applyOpen = false">关闭</button>
        </div>
        <SecurePdfPreviewer :record="preview" />
        <form v-if="applyOpen" class="mt-4 grid gap-3 sm:grid-cols-3" @submit.prevent="submitApply">
          <label class="text-xs text-slate-500">用途
            <select v-model="applyForm.purpose" class="input-light">
              <option value="CLINICAL_TREATMENT">临床诊疗</option>
              <option value="TEACHING_RESEARCH">教学科研</option>
              <option value="LEGAL_DISPUTE">法务调阅</option>
              <option value="PATIENT_COPY">患方复印</option>
            </select>
          </label>
          <label class="text-xs text-slate-500">时限（天）
            <input v-model.number="applyForm.days" type="number" min="1" max="7" class="input-light" />
          </label>
          <div class="flex items-end">
            <button class="btn-primary w-full" type="submit">提交分级审批</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
