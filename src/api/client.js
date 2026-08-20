/** Axios/Fetch client with local mock fallback when Worker / D1 is unavailable */
import axios from 'axios'

const TOKEN_KEY = 'sdmr_token'

export const DEMO_USERS = [
  { id: 'u_admin', username: 'admin', password: 'Admin@2026', real_name: '系统管理员', role: 'SUPER_ADMIN', department: '信息科', badge_no: 'SYS001' },
  { id: 'u_arch', username: 'archivist', password: 'Archive@2026', real_name: '赵雅琴', role: 'ARCHIVIST', department: '病案管理科', badge_no: 'MR002' },
  { id: 'u_doc1', username: 'doctor', password: 'Doctor@2026', real_name: '李志刚', role: 'CLINICIAN', department: '消化内科一区', badge_no: 'DOC108' },
  { id: 'u_audit', username: 'auditor', password: 'Audit@2026', real_name: '王督查', role: 'AUDITOR', department: '医疗质控科', badge_no: 'QC991' },
  { id: 'u_res', username: 'researcher', password: 'Research@2026', real_name: '周研', role: 'RESEARCHER', department: '科研处', badge_no: 'RS017' },
]

export const mock = {
  records: [
    { id: 'mr_001', mr_number: 'MR2026081401', patient_name: '张*强', patient_id_card: '37080219800101****', gender: '男', age: 46, admission_date: '2026-08-01 09:30:00', discharge_date: '2026-08-10 14:00:00', dept_name: '消化内科一区', attending_doctor: '李志刚', icd10_code: 'K29.500', diagnosis_name: '慢性萎缩性胃炎伴肠化生', archive_status: 'ARCHIVED_LOCKED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_001.pdf', digital_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', ca_sign_status: 1, page_count: 38 },
    { id: 'mr_002', mr_number: 'MR2026081402', patient_name: '刘*芳', patient_id_card: '37080219750512****', gender: '女', age: 51, admission_date: '2026-08-05 11:15:00', discharge_date: '2026-08-12 10:00:00', dept_name: '内镜微创中心', attending_doctor: '孙建国', icd10_code: 'K63.501', diagnosis_name: '结肠息肉内镜下高频电切术后', archive_status: 'DEPT_CHECKED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_002.pdf', digital_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', ca_sign_status: 1, page_count: 24 },
    { id: 'mr_003', mr_number: 'MR2026081403', patient_name: '王*山', patient_id_card: '37080219620920****', gender: '男', age: 64, admission_date: '2026-08-08 14:20:00', discharge_date: '2026-08-14 09:30:00', dept_name: '消化内科二区', attending_doctor: '陈明', icd10_code: 'K25.300', diagnosis_name: '急性胃溃疡伴活动性出血', archive_status: 'QC_REJECTED', pdf_r2_url: null, digital_hash: null, ca_sign_status: 0, page_count: 42 },
    { id: 'mr_004', mr_number: 'MR2026081501', patient_name: '赵*敏', patient_id_card: '37081119881203****', gender: '女', age: 38, admission_date: '2026-08-06 08:40:00', discharge_date: '2026-08-13 11:20:00', dept_name: '消化内科一区', attending_doctor: '李志刚', icd10_code: 'K51.900', diagnosis_name: '溃疡性结肠炎（缓解期）', archive_status: 'CONVERTED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_004.pdf', digital_hash: '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3', ca_sign_status: 1, page_count: 31 },
    { id: 'mr_005', mr_number: 'MR2026081502', patient_name: '孙*平', patient_id_card: '37010219701118****', gender: '男', age: 56, admission_date: '2026-08-04 15:10:00', discharge_date: '2026-08-11 16:45:00', dept_name: '肝病内科', attending_doctor: '周海燕', icd10_code: 'K76.000', diagnosis_name: '非酒精性脂肪性肝病', archive_status: 'PENDING_CONVERT', pdf_r2_url: null, digital_hash: null, ca_sign_status: 0, page_count: 18 },
    { id: 'mr_006', mr_number: 'MR2026081503', patient_name: '周*安', patient_id_card: '37081319650822****', gender: '男', age: 61, admission_date: '2026-07-28 10:05:00', discharge_date: '2026-08-09 09:00:00', dept_name: '普外科胃肠组', attending_doctor: '刘文博', icd10_code: 'C16.201', diagnosis_name: '早期胃癌 ESD 术后', archive_status: 'ARCHIVED_LOCKED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_006.pdf', digital_hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', ca_sign_status: 1, page_count: 56 },
    { id: 'mr_007', mr_number: 'MR2026081601', patient_name: '吴*梅', patient_id_card: '37081219830509****', gender: '女', age: 43, admission_date: '2026-08-09 13:22:00', discharge_date: '2026-08-15 10:30:00', dept_name: '内镜微创中心', attending_doctor: '孙建国', icd10_code: 'K21.000', diagnosis_name: '胃食管反流病', archive_status: 'DEPT_CHECKED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_007.pdf', digital_hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', ca_sign_status: 1, page_count: 21 },
    { id: 'mr_008', mr_number: 'MR2026081602', patient_name: '郑*华', patient_id_card: '37010219691127****', gender: '男', age: 57, admission_date: '2026-08-10 07:50:00', discharge_date: '2026-08-16 15:10:00', dept_name: '消化内科二区', attending_doctor: '陈明', icd10_code: 'K80.200', diagnosis_name: '胆囊结石伴慢性胆囊炎', archive_status: 'CONVERTED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_008.pdf', digital_hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', ca_sign_status: 0, page_count: 29 },
    { id: 'mr_009', mr_number: 'MR2026081701', patient_name: '冯*丽', patient_id_card: '37080219920416****', gender: '女', age: 34, admission_date: '2026-08-12 09:18:00', discharge_date: '2026-08-16 11:00:00', dept_name: '消化内科一区', attending_doctor: '李志刚', icd10_code: 'K58.900', diagnosis_name: '肠易激综合征', archive_status: 'PENDING_CONVERT', pdf_r2_url: null, digital_hash: null, ca_sign_status: 0, page_count: 16 },
    { id: 'mr_010', mr_number: 'MR2026081702', patient_name: '黄*杰', patient_id_card: '37081119780801****', gender: '男', age: 48, admission_date: '2026-08-02 16:40:00', discharge_date: '2026-08-08 14:20:00', dept_name: '肝病内科', attending_doctor: '周海燕', icd10_code: 'B18.101', diagnosis_name: '慢性乙型病毒性肝炎', archive_status: 'ARCHIVED_LOCKED', pdf_r2_url: 'https://26-sd-mr-bid-assets.softwarelink.net/mr_010.pdf', digital_hash: 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683', ca_sign_status: 1, page_count: 44 },
  ],
  qcHistory: [
    { id: 'qc_001', mr_id: 'mr_001', mr_number: 'MR2026081401', patient_name: '张*强', qc_level: 'ARCHIVE_LEVEL', qc_doctor_name: '赵雅琴', result: 'PASSED', defect_type: null, defect_comment: '终检通过，PDF/A 与 CA 指纹一致', created_at: '2026-08-11 16:40:00' },
    { id: 'qc_005', mr_id: 'mr_003', mr_number: 'MR2026081403', patient_name: '王*山', qc_level: 'ARCHIVE_LEVEL', qc_doctor_name: '赵雅琴', result: 'REJECTED', defect_type: '缺失知情同意书', defect_comment: '输血知情同意书扫描件缺失', created_at: '2026-08-15 09:05:00' },
    { id: 'qc_008', mr_id: 'mr_008', mr_number: 'MR2026081602', patient_name: '郑*华', qc_level: 'DEPT_LEVEL', qc_doctor_name: '李志刚', result: 'REJECTED', defect_type: '漏填主诉', defect_comment: '入院记录主诉未填写', created_at: '2026-08-16 17:11:00' },
  ],
  borrows: [
    { id: 'br_001', mr_id: 'mr_001', mr_number: 'MR2026081401', patient_name: '张*强', dept_name: '消化内科一区', diagnosis_name: '慢性萎缩性胃炎伴肠化生', applicant_id: 'u_res', applicant_name: '周研', purpose: 'TEACHING_RESEARCH', status: 'APPROVED', start_time: '2026-08-15 00:00:00', end_time: '2026-08-22 23:59:59', watermark_text: '山一大消化病医院-工号:RS017-科研调阅', created_at: '2026-08-14 16:20:00' },
    { id: 'br_002', mr_id: 'mr_006', mr_number: 'MR2026081503', patient_name: '周*安', dept_name: '普外科胃肠组', diagnosis_name: '早期胃癌 ESD 术后', applicant_id: 'u_res', applicant_name: '周研', purpose: 'TEACHING_RESEARCH', status: 'PENDING', start_time: null, end_time: null, watermark_text: null, created_at: '2026-08-16 11:05:00' },
    { id: 'br_003', mr_id: 'mr_010', mr_number: 'MR2026081702', patient_name: '黄*杰', dept_name: '肝病内科', diagnosis_name: '慢性乙型病毒性肝炎', applicant_id: 'u_audit', applicant_name: '王督查', purpose: 'LEGAL_DISPUTE', status: 'APPROVED', start_time: '2026-08-16 09:00:00', end_time: '2026-08-18 18:00:00', watermark_text: '山一大消化病医院-工号:QC991-法务调阅', created_at: '2026-08-16 08:50:00' },
    { id: 'br_004', mr_id: 'mr_002', mr_number: 'MR2026081402', patient_name: '刘*芳', dept_name: '内镜微创中心', diagnosis_name: '结肠息肉内镜下高频电切术后', applicant_id: 'u_doc1', applicant_name: '李志刚', purpose: 'CLINICAL_TREATMENT', status: 'EXPIRED', start_time: '2026-08-01 00:00:00', end_time: '2026-08-08 23:59:59', watermark_text: '山一大消化病医院-工号:DOC108-临床调阅', created_at: '2026-08-01 09:00:00' },
  ],
  configs: [
    { config_key: 'AUTO_CONVERT_ENABLED', config_value: 'true', description: '自动监听出院事件并触发PDF/A转换', is_feature_flag: 1 },
    { config_key: 'QC_DEFECT_STRICT_MODE', config_value: 'true', description: '质控缺陷一票否决归档', is_feature_flag: 1 },
    { config_key: 'WATERMARK_TEMPLATE', config_value: '山一大消化病医院-工号:{badge}-{time}', description: '在线调阅动态水印规则', is_feature_flag: 0 },
    { config_key: 'MAX_BORROW_DAYS', config_value: '7', description: '科研借阅最大有效天数', is_feature_flag: 0 },
  ],
  audit: [
    { id: 'aud_001', user_id: 'u_admin', user_name: '系统管理员', action: 'LOGIN', target_resource: 'auth', ip_address: '10.12.1.2', user_agent: 'Mozilla/5.0 Console', created_at: '2026-08-14 08:01:12' },
    { id: 'aud_002', user_id: 'u_arch', user_name: '赵雅琴', action: 'SIGN_VERIFY', target_resource: 'mr_001', ip_address: '10.12.8.8', user_agent: 'Mozilla/5.0 ArchiveDesk', created_at: '2026-08-11 16:41:03' },
    { id: 'aud_003', user_id: 'u_arch', user_name: '赵雅琴', action: 'REJECT_QC', target_resource: 'mr_003', ip_address: '10.12.8.8', user_agent: 'Mozilla/5.0 ArchiveDesk', created_at: '2026-08-15 09:05:22' },
    { id: 'aud_004', user_id: 'u_res', user_name: '周研', action: 'VIEW_RECORD', target_resource: 'mr_001', ip_address: '10.18.4.21', user_agent: 'Mozilla/5.0 ResearchPad', created_at: '2026-08-16 10:12:44' },
    { id: 'aud_005', user_id: 'u_doc1', user_name: '李志刚', action: 'CONVERT_PDF', target_resource: 'mr_004', ip_address: '10.12.8.21', user_agent: 'Mozilla/5.0 WardStation', created_at: '2026-08-15 11:33:09' },
    { id: 'aud_006', user_id: 'u_audit', user_name: '王督查', action: 'DOWNLOAD_PDF', target_resource: 'mr_010', ip_address: '10.12.8.90', user_agent: 'Mozilla/5.0 AuditBox', created_at: '2026-08-16 09:18:00' },
    { id: 'aud_007', user_id: 'u_admin', user_name: '系统管理员', action: 'UPDATE_CONFIG', target_resource: 'AUTO_CONVERT_ENABLED', ip_address: '10.12.1.2', user_agent: 'Mozilla/5.0 Console', created_at: '2026-08-14 08:12:00' },
  ],
  stats: {
    archive_rate: 96.8,
    archive_rate_3d: 96.4,
    archive_rate_7d: 96.8,
    grade_a_rate: 93.6,
    today_archived: 42,
    reject_rate: 4.2,
    ca_sign_rate: 99.1,
    pending_convert: 2,
    queue_depth: 17,
    trend: {
      days: ['08-11', '08-12', '08-13', '08-14', '08-15', '08-16', '08-17'],
      archive3: [88.2, 90.1, 91.4, 93.0, 94.2, 95.1, 96.4],
      archive7: [92.0, 92.6, 93.1, 94.0, 94.8, 95.6, 96.8],
      gradeA: [90.4, 91.0, 91.6, 92.2, 92.8, 93.1, 93.6],
    },
    heatmap: [
      { dept: '消化内科一区', load: 86 },
      { dept: '消化内科二区', load: 74 },
      { dept: '内镜微创中心', load: 91 },
      { dept: '肝病内科', load: 63 },
      { dept: '普外科胃肠组', load: 58 },
    ],
    defects: [
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
  },
}

const http = axios.create({ timeout: 8000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  config.headers = config.headers || {}
  config.headers['Content-Type'] = 'application/json'
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

async function request(path, options = {}) {
  try {
    const res = await http.request({ url: path, method: options.method || 'GET', data: options.body, params: options.params })
    if (res.data?.success === false) return null
    return res.data
  } catch (err) {
    const status = err.response?.status
    // 共享 allworld 由其他站点占用时，本站 /api/* 会 404；回退本地演示数据，避免覆盖 Worker
    if (!status || status === 404 || status >= 500) return null
    const body = err.response?.data || {}
    throw Object.assign(new Error(body.error || err.response.statusText), { status, body })
  }
}

function ok(data) {
  return { success: true, data }
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function login(username, password) {
  try {
    const remote = await request('/api/auth/login', { method: 'POST', body: { username, password } })
    if (remote?.success) return remote
  } catch {
    // ignore remote auth errors and use demo accounts
  }
  const user = DEMO_USERS.find((u) => u.username === username && u.password === password)
  if (!user) return { success: false, error: '账号或密码错误' }
  const { password: _p, ...safe } = user
  return { success: true, token: `demo.${btoa(unescape(encodeURIComponent(JSON.stringify(safe))))}`, user: safe }
}

export async function fetchStats() {
  const remote = await request('/api/stats')
  if (remote?.success) return remote.data
  return mock.stats
}

export async function fetchRecords(params = {}) {
  const remote = await request('/api/records', { params })
  if (remote?.success) return remote.data
  let list = [...mock.records]
  if (params.q) {
    const k = String(params.q).toLowerCase()
    list = list.filter((r) => [r.mr_number, r.patient_name, r.icd10_code, r.diagnosis_name, r.attending_doctor, r.dept_name].join(' ').toLowerCase().includes(k))
  }
  if (params.status) list = list.filter((r) => r.archive_status === params.status)
  if (params.dept) list = list.filter((r) => r.dept_name === params.dept)
  if (params.id) return list.find((r) => r.id === params.id || r.mr_number === params.id) || null
  return list
}

export async function fetchArchiveQueue() {
  const remote = await request('/api/archive')
  if (remote?.success) return remote.data
  return mock.records.filter((r) => r.archive_status === 'PENDING_CONVERT' || r.archive_status === 'CONVERTED')
}

export async function convertArchive(ids) {
  const remote = await request('/api/archive', { method: 'POST', body: { ids } })
  if (remote?.success) return remote
  ids.forEach((id) => {
    const row = mock.records.find((r) => r.id === id)
    if (row) {
      row.archive_status = 'CONVERTED'
      row.pdf_r2_url = `https://26-sd-mr-bid-assets.softwarelink.net/${id}.pdf`
      row.digital_hash = `${id.replace('_', '')}hash${Date.now().toString(16)}`.padEnd(64, 'a').slice(0, 64)
      row.ca_sign_status = 1
    }
  })
  return ok(ids.map((id) => mock.records.find((r) => r.id === id)))
}

export async function fetchQc() {
  const remote = await request('/api/qc')
  if (remote?.success) return remote.data
  return {
    records: mock.records.filter((r) => ['CONVERTED', 'DEPT_CHECKED', 'QC_REJECTED'].includes(r.archive_status)),
    history: mock.qcHistory,
  }
}

export async function submitQc(payload) {
  const remote = await request('/api/qc', { method: 'POST', body: payload })
  if (remote?.success) return remote
  const row = mock.records.find((r) => r.id === payload.mr_id)
  if (row) {
    if (payload.result === 'REJECTED') row.archive_status = 'QC_REJECTED'
    else if (payload.level === 'ARCHIVE_LEVEL') row.archive_status = 'ARCHIVED_LOCKED'
    else row.archive_status = 'DEPT_CHECKED'
  }
  mock.qcHistory.unshift({
    id: `qc_${Date.now()}`,
    mr_id: payload.mr_id,
    mr_number: row?.mr_number,
    patient_name: row?.patient_name,
    qc_level: payload.level || 'DEPT_LEVEL',
    qc_doctor_name: payload.qc_doctor_name,
    result: payload.result,
    defect_type: payload.defect_type,
    defect_comment: payload.defect_comment,
    created_at: nowSql(),
  })
  return ok(row)
}

export async function fetchBorrows() {
  const remote = await request('/api/borrow')
  if (remote?.success) return remote.data
  return mock.borrows
}

export async function applyBorrow(payload) {
  const remote = await request('/api/borrow', { method: 'POST', body: payload })
  if (remote?.success) return remote
  const rec = mock.records.find((r) => r.id === payload.mr_id)
  const auto = payload.purpose === 'CLINICAL_TREATMENT'
  const row = {
    id: `br_${Date.now()}`,
    mr_id: payload.mr_id,
    mr_number: rec?.mr_number,
    patient_name: rec?.patient_name,
    dept_name: rec?.dept_name,
    diagnosis_name: rec?.diagnosis_name,
    applicant_name: payload.applicant_name,
    applicant_id: payload.applicant_id,
    purpose: payload.purpose,
    status: auto ? 'APPROVED' : 'PENDING',
    start_time: auto ? nowSql() : null,
    end_time: auto ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' ') : null,
    watermark_text: payload.watermark_text,
    created_at: nowSql(),
  }
  mock.borrows.unshift(row)
  return ok(row)
}

export async function reviewBorrow(id, status) {
  const remote = await request('/api/borrow', { method: 'PATCH', body: { id, status } })
  if (remote?.success) return remote
  const row = mock.borrows.find((r) => r.id === id)
  if (row) {
    row.status = status
    if (status === 'APPROVED') {
      row.start_time = nowSql()
      row.end_time = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
    }
  }
  return ok(row)
}

export async function verifyCa(id) {
  const remote = await request('/api/ca', { params: { id } })
  if (remote?.success) return remote.data
  const row = mock.records.find((r) => r.id === id || r.mr_number === id)
  if (!row) return null
  return { ...row, tsa_time: row.digital_hash ? '2026-08-11T16:41:03+08:00' : null, fingerprint_ok: Boolean(row.digital_hash) && Number(row.ca_sign_status) === 1 }
}

export async function recomputeHash(payload) {
  const remote = await request('/api/ca', { method: 'POST', body: payload })
  if (remote?.success) return remote.data
  const text = payload.payload || payload.digital_hash || ''
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  const computed = hash.toString(16).padStart(64, '0')
  return { computed, match: computed === payload.digital_hash, algorithm: 'SHA-256', tsa: 'CF-Edge-TSA-DEMO', verified_at: new Date().toISOString() }
}

export async function fetchSystem() {
  const remote = await request('/api/system')
  if (remote?.success) return remote.data
  return { users: DEMO_USERS.map(({ password: _p, ...u }) => u), configs: mock.configs, audit: mock.audit }
}

export async function updateConfig(config_key, config_value) {
  const remote = await request('/api/system', { method: 'PATCH', body: { config_key, config_value } })
  if (remote?.success) return remote
  const row = mock.configs.find((c) => c.config_key === config_key)
  if (row) row.config_value = config_value
  return ok(row)
}

export const DEPTS = ['消化内科一区', '消化内科二区', '内镜微创中心', '肝病内科', '普外科胃肠组']
export const DEFECTS = ['缺失知情同意书', '签名不合规', '漏填主诉', '病程记录不连续', '出院诊断与编码不符']
