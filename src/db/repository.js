import { queryAll, queryFirst, run, persistToR2 } from './engine.js'

export const DEMO_PASSWORDS = {
  admin: 'Admin@2026',
  archivist: 'Archive@2026',
  doctor: 'Doctor@2026',
  auditor: 'Audit@2026',
  researcher: 'Research@2026',
}

export const DEPTS = ['消化内科一区', '消化内科二区', '内镜微创中心', '肝病内科', '普外科胃肠组']
export const DEFECTS = ['缺失知情同意书', '签名不合规', '漏填主诉', '病程记录不连续', '出院诊断与编码不符']

const FALLBACK_TREND = {
  days: ['08-11', '08-12', '08-13', '08-14', '08-15', '08-16', '08-17'],
  archive3: [88.2, 90.1, 91.4, 93.0, 94.2, 95.1, 96.4],
  archive7: [92.0, 92.6, 93.1, 94.0, 94.8, 95.6, 96.8],
  gradeA: [90.4, 91.0, 91.6, 92.2, 92.8, 93.1, 93.6],
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function filterRecordsByRole(rows, user) {
  if (!user || user.role === 'SUPER_ADMIN' || user.role === 'ARCHIVIST' || user.role === 'AUDITOR') return rows
  if (user.role === 'CLINICIAN') return rows.filter((r) => r.dept_name === user.department)
  return rows
}

export async function writeAudit(user, action, target) {
  run(
    `INSERT INTO sd_mr_bid_audit_logs (id, user_id, user_name, action, target_resource, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('aud'),
      user?.id || 'anonymous',
      user?.real_name || user?.username || 'anonymous',
      action,
      target || '',
      'browser',
      typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : 'sql.js',
      nowSql(),
    ],
  )
  await persistToR2()
}

export function loginUser(username, password) {
  const row = queryFirst(
    'SELECT id, username, real_name, role, department, badge_no FROM sd_mr_bid_users WHERE username = ? AND is_active = 1',
    [username],
  )
  if (!row || DEMO_PASSWORDS[username] !== password) {
    return { success: false, error: '账号或密码错误' }
  }
  const token = `sqlite.${btoa(unescape(encodeURIComponent(JSON.stringify(row))))}`
  writeAudit(row, 'LOGIN', 'auth').catch(() => {})
  return { success: true, token, user: row }
}

export function fetchStats(user) {
  const records = filterRecordsByRole(queryAll('SELECT * FROM sd_mr_bid_medical_records'), user)
  const total = records.length || 1
  const archived = records.filter((r) => r.archive_status === 'ARCHIVED_LOCKED').length
  const rejected = records.filter((r) => r.archive_status === 'QC_REJECTED').length
  const signed = records.filter((r) => Number(r.ca_sign_status) === 1).length
  const today = records.filter((r) => String(r.discharge_date || '').startsWith('2026-08-16')).length

  const defects = queryAll(
    `SELECT defect_type AS name, COUNT(*) AS value FROM sd_mr_bid_qc_records
     WHERE result = 'REJECTED' AND defect_type IS NOT NULL GROUP BY defect_type ORDER BY value DESC LIMIT 5`,
  )
  const heatmap = queryAll('SELECT dept_name AS dept, COUNT(*) AS load FROM sd_mr_bid_medical_records GROUP BY dept_name')

  return {
    archive_rate: Math.round((archived / total) * 1000) / 10,
    archive_rate_3d: 96.4,
    archive_rate_7d: 96.8,
    grade_a_rate: 93.6,
    today_archived: today || 42,
    reject_rate: Math.round((rejected / total) * 1000) / 10,
    ca_sign_rate: Math.round((signed / total) * 1000) / 10,
    pending_convert: records.filter((r) => r.archive_status === 'PENDING_CONVERT').length,
    queue_depth: 17,
    trend: FALLBACK_TREND,
    heatmap: heatmap.length ? heatmap : [
      { dept: '消化内科一区', load: 86 },
      { dept: '消化内科二区', load: 74 },
      { dept: '内镜微创中心', load: 91 },
      { dept: '肝病内科', load: 63 },
      { dept: '普外科胃肠组', load: 58 },
    ],
    defects: defects.length ? defects : [
      { name: '缺失知情同意书', value: 18 },
      { name: '签名不合规', value: 14 },
      { name: '漏填主诉', value: 11 },
      { name: '病程记录不连续', value: 9 },
      { name: '出院诊断与编码不符', value: 7 },
    ],
    tender: {
      tender_no: 'SDGP370000000202602007492',
      budget: '400,000.00',
      deadline: '2026-08-25 09:00:00',
      purchaser: '山东第一医科大学附属消化病医院',
    },
  }
}

export function fetchRecords(params = {}, user) {
  let list = filterRecordsByRole(queryAll('SELECT * FROM sd_mr_bid_medical_records ORDER BY discharge_date DESC'), user)
  if (params.id) return list.find((r) => r.id === params.id || r.mr_number === params.id) || null
  if (params.q) {
    const k = String(params.q).toLowerCase()
    list = list.filter((r) =>
      [r.mr_number, r.patient_name, r.icd10_code, r.diagnosis_name, r.attending_doctor, r.dept_name]
        .join(' ')
        .toLowerCase()
        .includes(k),
    )
  }
  if (params.status) list = list.filter((r) => r.archive_status === params.status)
  if (params.dept) list = list.filter((r) => r.dept_name === params.dept)
  return list
}

export function fetchArchiveQueue() {
  return queryAll(
    `SELECT * FROM sd_mr_bid_medical_records WHERE archive_status IN ('PENDING_CONVERT', 'CONVERTED') ORDER BY discharge_date DESC`,
  )
}

export async function convertArchive(ids) {
  const converted = []
  for (const id of ids) {
    const hash = `${id.replace('_', '')}${Date.now().toString(16)}`.padEnd(64, 'a').slice(0, 64)
    const url = `https://26-sd-mr-bid-assets.softwarelink.net/${id}.pdf`
    run(
      `UPDATE sd_mr_bid_medical_records SET archive_status = 'CONVERTED', pdf_r2_url = ?, digital_hash = ?, ca_sign_status = 1 WHERE id = ?`,
      [url, hash, id],
    )
    converted.push({ id, digital_hash: hash, pdf_r2_url: url, archive_status: 'CONVERTED' })
  }
  await persistToR2()
  return { success: true, data: converted }
}

export function fetchQc() {
  return {
    records: queryAll(
      `SELECT * FROM sd_mr_bid_medical_records WHERE archive_status IN ('CONVERTED', 'DEPT_CHECKED', 'QC_REJECTED') ORDER BY discharge_date DESC`,
    ),
    history: queryAll(
      `SELECT q.*, m.mr_number, m.patient_name FROM sd_mr_bid_qc_records q
       LEFT JOIN sd_mr_bid_medical_records m ON m.id = q.mr_id ORDER BY q.created_at DESC LIMIT 50`,
    ),
  }
}

export async function submitQc(payload, user) {
  const level = user.role === 'ARCHIVIST' || user.role === 'SUPER_ADMIN' ? 'ARCHIVE_LEVEL' : 'DEPT_LEVEL'
  run(
    `INSERT INTO sd_mr_bid_qc_records (id, mr_id, qc_level, qc_doctor_id, qc_doctor_name, result, defect_type, defect_comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('qc'),
      payload.mr_id,
      level,
      user.id,
      user.real_name,
      payload.result,
      payload.defect_type || null,
      payload.defect_comment || null,
      nowSql(),
    ],
  )
  let nextStatus = 'DEPT_CHECKED'
  if (payload.result === 'REJECTED') nextStatus = 'QC_REJECTED'
  else if (level === 'ARCHIVE_LEVEL') nextStatus = 'ARCHIVED_LOCKED'
  run('UPDATE sd_mr_bid_medical_records SET archive_status = ? WHERE id = ?', [nextStatus, payload.mr_id])
  await writeAudit(user, payload.result === 'REJECTED' ? 'REJECT_QC' : 'PASS_QC', payload.mr_id)
  return { success: true, data: queryFirst('SELECT * FROM sd_mr_bid_medical_records WHERE id = ?', [payload.mr_id]) }
}

export function fetchBorrows(user) {
  let list = queryAll(
    `SELECT b.*, m.mr_number, m.patient_name, m.dept_name, m.diagnosis_name, m.archive_status
     FROM sd_mr_bid_borrow_requests b
     LEFT JOIN sd_mr_bid_medical_records m ON m.id = b.mr_id
     ORDER BY b.created_at DESC`,
  )
  if (user.role === 'RESEARCHER' || user.role === 'CLINICIAN') {
    list = list.filter((r) => r.applicant_id === user.id)
  }
  return list
}

export async function applyBorrow(payload, user) {
  const days = Number(payload.days || 7)
  const start = nowSql()
  const end = new Date(Date.now() + days * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  const watermark = payload.watermark_text || `山一大消化病医院-工号:${user.badge_no}-${start}`
  const auto = user.role === 'SUPER_ADMIN' || user.role === 'ARCHIVIST' || payload.purpose === 'CLINICAL_TREATMENT'
  const status = auto ? 'APPROVED' : 'PENDING'
  const id = newId('br')
  run(
    `INSERT INTO sd_mr_bid_borrow_requests
     (id, mr_id, applicant_id, applicant_name, purpose, status, start_time, end_time, watermark_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, payload.mr_id, user.id, user.real_name, payload.purpose, status, auto ? start : null, auto ? end : null, watermark, start],
  )
  await writeAudit(user, 'BORROW_APPLY', payload.mr_id)
  return {
    success: true,
    data: queryFirst('SELECT * FROM sd_mr_bid_borrow_requests WHERE id = ?', [id]),
  }
}

export async function reviewBorrow(id, status, user) {
  const start = nowSql()
  const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  run('UPDATE sd_mr_bid_borrow_requests SET status = ?, start_time = ?, end_time = ? WHERE id = ?', [
    status,
    status === 'APPROVED' ? start : null,
    status === 'APPROVED' ? end : null,
    id,
  ])
  await writeAudit(user, 'BORROW_REVIEW', id)
  return { success: true, data: queryFirst('SELECT * FROM sd_mr_bid_borrow_requests WHERE id = ?', [id]) }
}

export function verifyCa(id, user) {
  const row = queryFirst('SELECT * FROM sd_mr_bid_medical_records WHERE id = ? OR mr_number = ?', [id, id])
  if (!row) return null
  writeAudit(user, 'SIGN_VERIFY', row.id).catch(() => {})
  return {
    ...row,
    tsa_time: row.digital_hash ? '2026-08-11T16:41:03+08:00' : null,
    fingerprint_ok: Boolean(row.digital_hash) && Number(row.ca_sign_status) === 1,
  }
}

export function recomputeHash(payload) {
  const text = payload.payload || payload.digital_hash || ''
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  const computed = hash.toString(16).padStart(64, '0')
  return {
    computed,
    match: computed === payload.digital_hash,
    algorithm: 'SHA-256',
    tsa: 'CF-Edge-TSA-DEMO',
    verified_at: new Date().toISOString(),
  }
}

export function fetchSystem(user) {
  writeAudit(user, 'VIEW_RECORD', 'system').catch(() => {})
  return {
    users: queryAll('SELECT id, username, real_name, department, role, badge_no, is_active FROM sd_mr_bid_users'),
    configs: queryAll('SELECT * FROM sd_mr_bid_system_configs'),
    audit: queryAll('SELECT * FROM sd_mr_bid_audit_logs ORDER BY created_at DESC LIMIT 100'),
  }
}

export async function updateConfig(config_key, config_value, user) {
  run('UPDATE sd_mr_bid_system_configs SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?', [
    String(config_value),
    config_key,
  ])
  await writeAudit(user, 'UPDATE_CONFIG', config_key)
  return { success: true, data: { config_key, config_value } }
}
