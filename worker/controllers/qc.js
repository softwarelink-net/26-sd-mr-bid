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
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'AUDITOR'])
  if (auth.error) return auth.error
  const records = await queryAll(
    context.env,
    `SELECT * FROM sd_mr_bid_medical_records
     WHERE archive_status IN ('CONVERTED', 'DEPT_CHECKED', 'QC_REJECTED')
     ORDER BY discharge_date DESC`,
  )
  const history = await queryAll(
    context.env,
    `SELECT q.*, m.mr_number, m.patient_name
     FROM sd_mr_bid_qc_records q
     LEFT JOIN sd_mr_bid_medical_records m ON m.id = q.mr_id
     ORDER BY q.created_at DESC
     LIMIT 50`,
  )
  return json({ success: true, data: { records: records || [], history: history || [] } })
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN'])
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  if (!body?.mr_id || !body?.result) return error('缺少质控结果')

  const level = auth.user.role === 'ARCHIVIST' || auth.user.role === 'SUPER_ADMIN' ? 'ARCHIVE_LEVEL' : 'DEPT_LEVEL'
  const id = newId('qc')
  await runSql(
    context.env,
    `INSERT INTO sd_mr_bid_qc_records
     (id, mr_id, qc_level, qc_doctor_id, qc_doctor_name, result, defect_type, defect_comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.mr_id,
      level,
      auth.user.id,
      auth.user.real_name,
      body.result,
      body.defect_type || null,
      body.defect_comment || null,
      nowSql(),
    ],
  )

  let nextStatus = 'DEPT_CHECKED'
  if (body.result === 'REJECTED') nextStatus = 'QC_REJECTED'
  else if (level === 'ARCHIVE_LEVEL') nextStatus = 'ARCHIVED_LOCKED'

  await runSql(context.env, 'UPDATE sd_mr_bid_medical_records SET archive_status = ? WHERE id = ?', [nextStatus, body.mr_id])
  await writeAudit(
    context.env,
    auth.user,
    body.result === 'REJECTED' ? 'REJECT_QC' : 'PASS_QC',
    body.mr_id,
    clientIp(context.request),
    userAgent(context.request),
  )

  const row = await queryFirst(context.env, 'SELECT * FROM sd_mr_bid_medical_records WHERE id = ?', [body.mr_id])
  return json({ success: true, data: { qc_id: id, record: row } })
}
