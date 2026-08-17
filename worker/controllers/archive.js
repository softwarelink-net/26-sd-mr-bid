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
  sha256Hex,
  nowSql,
} from './_shared.js'

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN'])
  if (auth.error) return auth.error
  const rows = await queryAll(
    context.env,
    `SELECT * FROM sd_mr_bid_medical_records
     WHERE archive_status IN ('PENDING_CONVERT', 'CONVERTED')
     ORDER BY discharge_date DESC`,
  )
  return json({ success: true, data: rows || [] })
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN'])
  if (auth.error) return auth.error
  const body = await parseBody(context.request)
  const ids = body?.ids || (body?.id ? [body.id] : [])
  if (!ids.length) return error('请选择待转换病案')

  const converted = []
  for (const id of ids) {
    const row = await queryFirst(context.env, 'SELECT * FROM sd_mr_bid_medical_records WHERE id = ?', [id])
    if (!row) continue
    const hash = await sha256Hex(`${row.mr_number}|${row.patient_name}|${nowSql()}|PDF/A`)
    const url = `https://26-sd-mr-bid-assets.softwarelink.net/${id}.pdf`
    await runSql(
      context.env,
      `UPDATE sd_mr_bid_medical_records
       SET archive_status = 'CONVERTED', pdf_r2_url = ?, digital_hash = ?, ca_sign_status = 1
       WHERE id = ?`,
      [url, hash, id],
    )
    converted.push({ id, digital_hash: hash, pdf_r2_url: url, archive_status: 'CONVERTED' })
  }

  await writeAudit(
    context.env,
    auth.user,
    'CONVERT_PDF',
    ids.join(','),
    clientIp(context.request),
    userAgent(context.request),
  )
  return json({ success: true, data: converted })
}
