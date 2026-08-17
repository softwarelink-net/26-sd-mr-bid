import { json, error, parseBody, requireAuth, queryFirst, writeAudit, clientIp, userAgent, sha256Hex } from './_shared.js'

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'AUDITOR'])
  if (auth.error) return auth.error
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id') || url.searchParams.get('mr')
  if (!id) return error('请提供病案号或病案 ID')
  const row = await queryFirst(
    context.env,
    'SELECT * FROM sd_mr_bid_medical_records WHERE id = ? OR mr_number = ?',
    [id, id],
  )
  if (!row) return json({ success: false, error: '病案不存在' }, 404)
  await writeAudit(context.env, auth.user, 'SIGN_VERIFY', row.id, clientIp(context.request), userAgent(context.request))
  return json({
    success: true,
    data: {
      ...row,
      tsa_time: row.digital_hash ? '2026-08-11T16:41:03+08:00' : null,
      fingerprint_ok: Boolean(row.digital_hash) && Number(row.ca_sign_status) === 1,
    },
  })
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST'])
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  if (!body?.payload && !body?.digital_hash) return error('请提供待核验哈希或原文')
  const computed = body.payload ? await sha256Hex(body.payload) : body.digital_hash
  const match = body.digital_hash ? computed === body.digital_hash || computed === body.expect_hash : true
  await writeAudit(context.env, auth.user, 'SIGN_VERIFY', body.mr_id || 'manual', clientIp(context.request), userAgent(context.request))
  return json({
    success: true,
    data: {
      computed,
      match,
      algorithm: 'SHA-256',
      tsa: 'CF-Edge-TSA-DEMO',
      verified_at: new Date().toISOString(),
    },
  })
}
