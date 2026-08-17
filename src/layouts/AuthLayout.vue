<script setup>
import { RouterView } from 'vue-router'
import { FileArchive } from 'lucide-vue-next'
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-40px)] items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-slate-100 px-4 py-10"
  >
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 text-primary-700 shadow-sm"
        >
          <FileArchive class="h-7 w-7" />
        </div>
        <h1 class="text-xl font-semibold tracking-wide text-slate-800">山东第一医科大学附属消化病医院</h1>
        <p class="mt-1 text-sm text-secondary-700">病案无纸化归档系统 · 原型演示</p>
        <p class="mt-2 font-mono text-[11px] text-slate-400">SDGP370000000202602007492</p>
      </div>
      <RouterView />
      <p class="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
        演示数据均经伪化脱敏，不包含真实患者 PHI。本系统仅用于技术方案演示与架构验证。
      </p>
    </div>
  </div>
</template>
