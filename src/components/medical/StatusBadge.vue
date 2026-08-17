<script setup>
const props = defineProps({
  status: { type: String, default: '' },
  kind: { type: String, default: 'archive' },
})

const ARCHIVE = {
  PENDING_CONVERT: { label: '待转换', cls: 'bg-amber-50 text-amber-700' },
  CONVERTED: { label: '已转PDF/A', cls: 'bg-sky-50 text-sky-700' },
  DEPT_CHECKED: { label: '科室已检', cls: 'bg-indigo-50 text-indigo-700' },
  QC_REJECTED: { label: '质控驳回', cls: 'bg-rose-50 text-rose-700' },
  ARCHIVED_LOCKED: { label: '已封存上锁', cls: 'bg-emerald-50 text-emerald-700' },
}

const QC = {
  PASSED: { label: '通过', cls: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: '驳回', cls: 'bg-rose-50 text-rose-700' },
  DEPT_LEVEL: { label: '科室初检', cls: 'bg-slate-100 text-slate-700' },
  ARCHIVE_LEVEL: { label: '病案终检', cls: 'bg-sky-50 text-sky-800' },
}

const BORROW = {
  PENDING: { label: '待审批', cls: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: '已授权', cls: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: '已拒绝', cls: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: '已过期回收', cls: 'bg-slate-100 text-slate-500' },
  CLINICAL_TREATMENT: { label: '临床诊疗', cls: 'bg-sky-50 text-sky-700' },
  TEACHING_RESEARCH: { label: '教学科研', cls: 'bg-indigo-50 text-indigo-700' },
  LEGAL_DISPUTE: { label: '法务调阅', cls: 'bg-orange-50 text-orange-700' },
  PATIENT_COPY: { label: '患方复印', cls: 'bg-teal-50 text-teal-700' },
}

function meta() {
  const map = props.kind === 'qc' ? QC : props.kind === 'borrow' ? BORROW : ARCHIVE
  return map[props.status] || { label: props.status || '—', cls: 'bg-slate-100 text-slate-600' }
}
</script>

<template>
  <span class="badge" :class="meta().cls">{{ meta().label }}</span>
</template>
