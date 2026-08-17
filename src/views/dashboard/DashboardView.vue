<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { Timer } from 'lucide-vue-next'
import { fetchStats } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const auth = useAuthStore()
const stats = ref(null)
const trendRef = ref(null)
const heatRef = ref(null)
const defectRef = ref(null)
let charts = []

const countdown = computed(() => {
  const end = new Date('2026-08-25T09:00:00+08:00').getTime()
  const diff = Math.max(0, end - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
})

const deptHint = computed(() => (auth.role === 'CLINICIAN' ? `仅统计本科室：${auth.user?.department}` : '全院口径'))

let timer = null

async function renderCharts() {
  charts.forEach((c) => c.dispose())
  charts = []
  const s = stats.value
  if (!s) return
  const echarts = await import('echarts')

  if (trendRef.value) {
    const c = echarts.init(trendRef.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['3日归档率', '7日归档率', '甲级病案率'] },
      grid: { left: 40, right: 16, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: s.trend.days },
      yAxis: { type: 'value', min: 80, axisLabel: { formatter: '{value}%' } },
      series: [
        { name: '3日归档率', type: 'line', smooth: true, data: s.trend.archive3 },
        { name: '7日归档率', type: 'line', smooth: true, data: s.trend.archive7 },
        { name: '甲级病案率', type: 'line', smooth: true, data: s.trend.gradeA },
      ],
      color: ['#0284c7', '#0f172a', '#0f766e'],
    })
    charts.push(c)
  }

  if (heatRef.value) {
    const c = echarts.init(heatRef.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 96, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'value', name: '负荷' },
      yAxis: { type: 'category', data: s.heatmap.map((d) => d.dept) },
      visualMap: { min: 40, max: 100, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#e0f2fe', '#0369a1'] } },
      series: [{
        type: 'bar',
        data: s.heatmap.map((d) => d.load),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      }],
    })
    charts.push(c)
  }

  if (defectRef.value) {
    const c = echarts.init(defectRef.value)
    c.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        data: s.defects,
        label: { formatter: '{b}\n{c}' },
      }],
      color: ['#0369a1', '#0ea5e9', '#f97316', '#e11d48', '#64748b'],
    })
    charts.push(c)
  }
}

function onResize() {
  charts.forEach((c) => c.resize())
}

onMounted(async () => {
  stats.value = await fetchStats()
  await renderCharts()
  window.addEventListener('resize', onResize)
  timer = setInterval(() => {
    stats.value = { ...stats.value }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach((c) => c.dispose())
  clearInterval(timer)
})
</script>

<template>
  <div class="space-y-6">
    <section class="relative overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-800 via-primary-800 to-slate-900 p-6 text-white md:p-8">
      <p class="text-xs uppercase tracking-wider text-sky-100/80">山东第一医科大学附属消化病医院 · 竞争性磋商原型</p>
      <h1 class="mt-2 max-w-3xl text-2xl font-semibold md:text-3xl">病案无纸化归档 · 三级质控 · 安全借阅一体化工作台</h1>
      <p class="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/90">
        项目编号 {{ stats?.tender?.tender_no || 'SDGP370000000202602007492' }} · 采购 1 套无纸化归档软件 · 预算 {{ stats?.tender?.budget || '400,000.00' }} 元 · 合同履行 60 日历天。
      </p>
      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="(unit, key) in { days: '天', hours: '时', minutes: '分', seconds: '秒' }" :key="key" class="rounded-lg bg-white/10 px-3 py-3 text-center backdrop-blur">
          <p class="font-mono text-2xl font-semibold">{{ String(countdown[key] ?? 0).padStart(2, '0') }}</p>
          <p class="mt-1 text-xs text-sky-100/80">{{ unit }}</p>
        </div>
      </div>
      <p class="mt-3 flex items-center gap-2 text-xs text-amber-200">
        <Timer class="h-3.5 w-3.5" />
        响应截止：2026-08-25 09:00（北京时间） · {{ deptHint }}
      </p>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="7日归档率" :value="`${stats?.archive_rate_7d ?? '--'}%`" hint="出院 7 日内完成 PDF/A 封存" />
      <MetricCard label="今日归档量" :value="stats?.today_archived ?? '--'" hint="自动监听 HIS 出院事件" />
      <MetricCard label="质控驳回率" :value="`${stats?.reject_rate ?? '--'}%`" hint="缺陷一票否决归档" tone="warn" />
      <MetricCard label="CA 验签率" :value="`${stats?.ca_sign_rate ?? '--'}%`" hint="国密签名 + TSA 时间戳" tone="success" />
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <div class="panel lg:col-span-2">
        <div class="panel-header">3日 / 7日归档率与甲级病案率趋势</div>
        <div ref="trendRef" class="h-72 p-2" />
      </div>
      <div class="panel">
        <div class="panel-header">常见缺陷 Top5</div>
        <div ref="defectRef" class="h-72 p-2" />
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">科室负荷热力（待归档/在检队列）</div>
      <div ref="heatRef" class="h-80 p-2" />
    </section>
  </div>
</template>
