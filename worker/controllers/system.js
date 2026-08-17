import { json, error, parseBody, requireAuth, queryAll, runSql, writeAudit, clientIp, userAgent, MOCK_USERS } from './_shared.js'

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'AUDITOR'])
  if (auth.error) return auth.error
  const users = await queryAll(
    context.env,
    'SELECT id, username, real_name, department, role, badge_no, is_active FROM sd_mr_bid_users',
  )
  const configs = await queryAll(context.env, 'SELECT * FROM sd_mr_bid_system_configs')
  const audit = await queryAll(
    context.env,
    'SELECT * FROM sd_mr_bid_audit_logs ORDER BY created_at DESC LIMIT 100',
  )
  await writeAudit(context.env, auth.user, 'VIEW_RECORD', 'system', clientIp(context.request), userAgent(context.request))
  return json({
    success: true,
    data: {
      users: users?.length ? users : MOCK_USERS,
      configs: configs || [],
      audit: audit || [],
    },
  })
}

export async function onRequestPatch(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN'])
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  if (!body?.config_key) return error('缺少配置键')
  const ok = await runSql(
    context.env,
    'UPDATE sd_mr_bid_system_configs SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
    [String(body.config_value), body.config_key],
  )
  if (!ok) return error('更新失败', 500)
  await writeAudit(context.env, auth.user, 'UPDATE_CONFIG', body.config_key, clientIp(context.request), userAgent(context.request))
  return json({ success: true, data: { config_key: body.config_key, config_value: body.config_value } })
}
