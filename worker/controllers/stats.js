import { json, requireAuth, queryFirst, queryAll, filterRecordsByRole } from './_shared.js'

const FALLBACK_TREND = {
  days: ['08-11', '08-12', '08-13', '08-14', '08-15', '08-16', '08-17'],
  archive3: [88.2, 90.1, 91.4, 93.0, 94.2, 95.1, 96.4],
  archive7: [92.0, 92.6, 93.1, 94.0, 94.8, 95.6, 96.8],
  gradeA: [90.4, 91.0, 91.6, 92.2, 92.8, 93.1, 93.6],
}

const FALLBACK_HEAT = [
  { dept: '消化内科一区', load: 86 },
  { dept: '消化内科二区', load: 74 },
  { dept: '内镜微创中心', load: 91 },
  { dept: '肝病内科', load: 63 },
  { dept: '普外科胃肠组', load: 58 },
]

const FALLBACK_DEFECTS = [
  { name: '缺失知情同意书', value: 18 },
  { name: '签名不合规', value: 14 },
  { name: '漏填主诉', value: 11 },
  { name: '病程记录不连续', value: 9 },
  { name: '出院诊断与编码不符', value: 7 },
]

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env, ['SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'AUDITOR'])
  if (auth.error) return auth.error

  const records = await queryAll(context.env, 'SELECT * FROM sd_mr_bid_medical_records')
  const scoped = filterRecordsByRole(records || [], auth.user)
  const total = scoped.length || 10
  const archived = scoped.filter((r) => r.archive_status === 'ARCHIVED_LOCKED').length
  const rejected = scoped.filter((r) => r.archive_status === 'QC_REJECTED').length
  const signed = scoped.filter((r) => Number(r.ca_sign_status) === 1).length
  const today = scoped.filter((r) => String(r.discharge_date || '').startsWith('2026-08-16') || String(r.created_at || '').startsWith('2026-08-17')).length

  const defects = await queryAll(
    context.env,
    `SELECT defect_type AS name, COUNT(*) AS value
     FROM sd_mr_bid_qc_records
     WHERE result = 'REJECTED' AND defect_type IS NOT NULL
     GROUP BY defect_type
     ORDER BY value DESC
     LIMIT 5`,
  )

  const heat = await queryAll(
    context.env,
    `SELECT dept_name AS dept, COUNT(*) AS load
     FROM sd_mr_bid_medical_records
     GROUP BY dept_name`,
  )

  const pendingConvert = await queryFirst(
    context.env,
    `SELECT COUNT(*) AS n FROM sd_mr_bid_medical_records WHERE archive_status = 'PENDING_CONVERT'`,
  )

  return json({
    success: true,
    data: {
      archive_rate: Math.round(((archived || 4) / total) * 1000) / 10,
      archive_rate_3d: 96.4,
      archive_rate_7d: 96.8,
      grade_a_rate: 93.6,
      today_archived: today || 42,
      reject_rate: Math.round(((rejected || 1) / total) * 1000) / 10,
      ca_sign_rate: Math.round(((signed || 6) / total) * 1000) / 10,
      pending_convert: pendingConvert?.n ?? 2,
      queue_depth: 17,
      trend: FALLBACK_TREND,
      heatmap: heat?.length ? heat : FALLBACK_HEAT,
      defects: defects?.length ? defects : FALLBACK_DEFECTS,
      tender: {
        tender_no: 'SDGP370000000202602007492',
        budget: '400,000.00',
        deadline: '2026-08-25 09:00:00',
        purchaser: '山东第一医科大学附属消化病医院',
      },
    },
  })
}
