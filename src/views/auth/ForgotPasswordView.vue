<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="panel space-y-4 p-6">
    <h2 class="text-lg font-semibold text-slate-800">找回密码</h2>
    <p class="text-sm leading-relaxed text-slate-500">
      演示环境不开放自助重置。请使用 README 中的角色演示账号，或联系医院信息科对接院内统一身份认证。
    </p>
    <ul class="list-disc space-y-1 pl-5 text-xs text-slate-500">
      <li>超级管理员：admin / Admin@2026</li>
      <li>病案质控员：archivist / Archive@2026</li>
      <li>临床医师：doctor / Doctor@2026</li>
    </ul>
    <RouterLink to="/login" class="btn-primary inline-flex">返回登录</RouterLink>
  </div>
</template>
