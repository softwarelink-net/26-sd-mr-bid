<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '--' },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'primary' },
})

const toneClass = {
  primary: 'text-primary-700',
  warn: 'text-orange-600',
  danger: 'text-rose-600',
  success: 'text-emerald-700',
}
</script>

<template>
  <div class="panel p-4">
    <p class="label-muted">{{ label }}</p>
    <p class="stat-value mt-2" :class="toneClass[tone] || toneClass.primary">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
