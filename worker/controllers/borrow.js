import {
  json,
  error,
  parseBody,
  requireAuth,
  queryAll,
  queryFirst,
  runSql,
  writeAudit,
  clientIp,
  userAgent,
  newId,
  nowSql,
} from './_shared.js'

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env)
  if (auth.error) return auth.error
  const rows = await queryAll(
    context.env,
    `SELECT b.*, m.mr_number, m.patient_name, m.dept_name, m.diagnosis_name, m.archive_status
     FROM sd_mr_bid_borrow_requests b
     LEFT JOIN sd_mr_bid_medical_records m ON m.id = b.mr_id
     ORDER BY b.created_at DESC`,
  )
  let list = rows || []
  if (auth.user.role === 'RESEARCHER' || auth.user.role === 'CLINICIAN') {
    list = list.filter((r) => r.applicant_id === auth.user.id)
  }
  return json({ success: true, data: list })
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env)
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  if (!body?.mr_id || !body?.purpose) return error('请选择病案与借阅用途')

  const days = Number(body.days || 7)
  const id = newId('br')
  const start = nowSql()
  const endDate = new Date(Date.now() + days * 86400000)
  const end = endDate.toISOString().slice(0, 19).replace('T', ' ')
  const watermark = `山一大消化病医院-工号:${auth.user.badge_no || 'NA'}-${start}`
  const autoApprove = auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'ARCHIVIST' || body.purpose === 'CLINICAL_TREATMENT'
  const status = autoApprove ? 'APPROVED' : 'PENDING'

  await runSql(
    context.env,
    `INSERT INTO sd_mr_bid_borrow_requests
     (id, mr_id, applicant_id, applicant_name, purpose, status, start_time, end_time, watermark_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.mr_id, auth.user.id, auth.user.real_name, body.purpose, status, autoApprove ? start : null, autoApprove ? end : null, watermark, start],
  )
  await writeAudit(context.env, auth.user, 'BORROW_APPLY', body.mr_id, clientIp(context.request), userAgent(context.request))
  return json({ success: true, data: { id, status, watermark_text: watermark, start_time: autoApprove ? start : null, end_time: autoApprove ? end : null } })
}

export async function onRequestPatch(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST'])
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  if (!body?.id || !body?.status) return error('缺少审批参数')
  const start = nowSql()
  const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  await runSql(
    context.env,
    `UPDATE sd_mr_bid_borrow_requests
     SET status = ?, start_time = ?, end_time = ?
     WHERE id = ?`,
    [body.status, body.status === 'APPROVED' ? start : null, body.status === 'APPROVED' ? end : null, body.id],
  )
  await writeAudit(context.env, auth.user, 'BORROW_REVIEW', body.id, clientIp(context.request), userAgent(context.request))
  const row = await queryFirst(context.env, 'SELECT * FROM sd_mr_bid_borrow_requests WHERE id = ?', [body.id])
  return json({ success: true, data: row })
}
