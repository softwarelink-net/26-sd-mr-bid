import { json, requireAuth, queryAll, queryFirst, filterRecordsByRole } from './_shared.js'

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env)
  if (auth.error) return auth.error

  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  const keyword = url.searchParams.get('q') || ''
  const status = url.searchParams.get('status') || ''
  const dept = url.searchParams.get('dept') || ''

  if (id) {
    const row = await queryFirst(context.env, 'SELECT * FROM sd_mr_bid_medical_records WHERE id = ? OR mr_number = ?', [id, id])
    if (!row) return json({ success: false, error: '病案不存在' }, 404)
    const scoped = filterRecordsByRole([row], auth.user)
    if (!scoped.length && auth.user.role !== 'RESEARCHER') {
      return json({ success: false, error: '无权调阅该病案' }, 403)
    }
    return json({ success: true, data: row })
  }

  const rows = await queryAll(context.env, 'SELECT * FROM sd_mr_bid_medical_records ORDER BY discharge_date DESC')
  let list = filterRecordsByRole(rows || [], auth.user)
  if (keyword) {
    const k = keyword.toLowerCase()
    list = list.filter((r) =>
      [r.mr_number, r.patient_name, r.icd10_code, r.diagnosis_name, r.attending_doctor, r.dept_name]
        .join(' ')
        .toLowerCase()
        .includes(k),
    )
  }
  if (status) list = list.filter((r) => r.archive_status === status)
  if (dept) list = list.filter((r) => r.dept_name === dept)
  return json({ success: true, data: list })
}
