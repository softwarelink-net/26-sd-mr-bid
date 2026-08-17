<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const props = defineProps({
  record: { type: Object, default: null },
})

const auth = useAuthStore()
const app = useAppStore()
const canvasRef = ref(null)
const blocked = ref(false)
let timer = null

function watermarkText() {
  const badge = auth.badgeNo
  const ip = app.clientIp
  const ts = new Date().toLocaleString('zh-CN', { hour12: false })
  return `山一大消化病医院-工号:${badge}-${ip}-${ts}`
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.fillRect(48, 36, w - 96, h - 72)
  ctx.strokeRect(48, 36, w - 96, h - 72)

  ctx.fillStyle = '#0c4a6e'
  ctx.font = 'bold 18px "PingFang SC", sans-serif'
  ctx.fillText('山东第一医科大学附属消化病医院', 72, 80)
  ctx.font = '13px "PingFang SC", sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText('电子病案 PDF/A 安全阅读器 · 演示脱敏件', 72, 104)

  const rec = props.record || {}
  const lines = [
    `病案号：${rec.mr_number || '—'}`,
    `患者：${rec.patient_name || '—'}    性别/年龄：${rec.gender || '—'} / ${rec.age || '—'}`,
    `身份证：${rec.patient_id_card || '—'}`,
    `科室：${rec.dept_name || '—'}    主治：${rec.attending_doctor || '—'}`,
    `入院：${rec.admission_date || '—'}`,
    `出院：${rec.discharge_date || '—'}`,
    `诊断：${rec.icd10_code || ''} ${rec.diagnosis_name || ''}`,
    `页数：${rec.page_count || 0}    SHA-256：${(rec.digital_hash || '未固化').slice(0, 24)}…`,
    '',
    '【入院记录摘要】主诉、现病史、既往史均已脱敏展示。',
    '【知情同意】手术/内镜/输血知情同意书扫描页已嵌入 PDF/A。',
    '【病程记录】每日查房记录连续，签名经国密 CA 验签。',
    '【出院小结】疗效评估与随访医嘱已归档封存。',
  ]
  ctx.fillStyle = '#334155'
  ctx.font = '13px "PingFang SC", sans-serif'
  lines.forEach((line, i) => ctx.fillText(line, 72, 140 + i * 22))

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.font = '14px "PingFang SC", sans-serif'
  ctx.fillStyle = 'rgba(3, 105, 161, 0.18)'
  const mark = watermarkText()
  for (let y = -h; y < h; y += 64) {
    for (let x = -w; x < w; x += 280) {
      ctx.fillText(mark, x, y)
    }
  }
  ctx.restore()
}

function onContext(e) {
  e.preventDefault()
}

function onKey(e) {
  if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
    blocked.value = true
    setTimeout(() => {
      blocked.value = false
    }, 1600)
  }
}

function onVisibility() {
  if (document.hidden) blocked.value = true
  else blocked.value = false
}

onMounted(() => {
  draw()
  timer = setInterval(draw, 1000)
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
})

watch(() => props.record, draw, { deep: true })
</script>

<template>
  <div class="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100" @contextmenu="onContext">
    <canvas ref="canvasRef" width="920" height="560" class="block h-auto w-full select-none" />
    <div
      v-if="blocked"
      class="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-sm text-white"
    >
      检测到截屏/切屏行为，内容已临时遮蔽并写入审计日志。
    </div>
    <p class="absolute bottom-2 left-3 right-3 truncate font-mono text-[10px] text-sky-900/70">
      动态水印：工号 + IP + 时间戳 · 禁止复制/右键 · 非法截图将被审计
    </p>
  </div>
</template>
