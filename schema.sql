-- Cloudflare D1 Database Schema for 26-sd-mr-bid
-- Prefix: sd_mr_bid_

DROP TABLE IF EXISTS sd_mr_bid_audit_logs;
DROP TABLE IF EXISTS sd_mr_bid_borrow_requests;
DROP TABLE IF EXISTS sd_mr_bid_qc_records;
DROP TABLE IF EXISTS sd_mr_bid_medical_records;
DROP TABLE IF EXISTS sd_mr_bid_system_configs;
DROP TABLE IF EXISTS sd_mr_bid_users;

-- 1. Users & RBAC
CREATE TABLE sd_mr_bid_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ARCHIVIST', 'CLINICIAN', 'RESEARCHER', 'AUDITOR')),
    department TEXT NOT NULL,
    badge_no TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. System Configurations & Feature Flags
CREATE TABLE sd_mr_bid_system_configs (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    is_feature_flag INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Medical Records Master Table
CREATE TABLE sd_mr_bid_medical_records (
    id TEXT PRIMARY KEY,
    mr_number TEXT NOT NULL UNIQUE,          -- 病案号 (e.g. MR202608001)
    patient_name TEXT NOT NULL,              -- 脱敏患者姓名
    patient_id_card TEXT NOT NULL,           -- 脱敏身份证 (e.g. 3708************12)
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    admission_date DATETIME NOT NULL,
    discharge_date DATETIME NOT NULL,
    dept_name TEXT NOT NULL,                 -- 消化内科一区 / 内镜微创中心
    attending_doctor TEXT NOT NULL,          -- 主治医师
    icd10_code TEXT NOT NULL,                -- 主要诊断编码 (e.g. K29.500)
    diagnosis_name TEXT NOT NULL,            -- 慢性萎缩性胃炎
    archive_status TEXT NOT NULL CHECK(archive_status IN ('PENDING_CONVERT', 'CONVERTED', 'DEPT_CHECKED', 'QC_REJECTED', 'ARCHIVED_LOCKED')),
    pdf_r2_url TEXT,                         -- R2 存储路径
    digital_hash TEXT,                       -- SHA-256 哈希值
    ca_sign_status INTEGER DEFAULT 0,        -- 0:未签名, 1:已验签
    page_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Quality Control History Table
CREATE TABLE sd_mr_bid_qc_records (
    id TEXT PRIMARY KEY,
    mr_id TEXT NOT NULL,
    qc_level TEXT NOT NULL CHECK(qc_level IN ('DEPT_LEVEL', 'ARCHIVE_LEVEL')),
    qc_doctor_id TEXT NOT NULL,
    qc_doctor_name TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('PASSED', 'REJECTED')),
    defect_type TEXT,                        -- 缺失知情同意书, 签名不合规, 漏填主诉
    defect_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mr_id) REFERENCES sd_mr_bid_medical_records(id)
);

-- 5. Borrowing & Access Request Table
CREATE TABLE sd_mr_bid_borrow_requests (
    id TEXT PRIMARY KEY,
    mr_id TEXT NOT NULL,
    applicant_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK(purpose IN ('CLINICAL_TREATMENT', 'TEACHING_RESEARCH', 'LEGAL_DISPUTE', 'PATIENT_COPY')),
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    start_time DATETIME,
    end_time DATETIME,
    watermark_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mr_id) REFERENCES sd_mr_bid_medical_records(id)
);

-- 6. Immutable Security & Audit Log
CREATE TABLE sd_mr_bid_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,                    -- VIEW_RECORD, DOWNLOAD_PDF, SIGN_VERIFY, REJECT_QC
    target_resource TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data Initialization
INSERT INTO sd_mr_bid_system_configs (config_key, config_value, description, is_feature_flag) VALUES
('AUTO_CONVERT_ENABLED', 'true', '自动监听出院事件并触发PDF/A转换', 1),
('QC_DEFECT_STRICT_MODE', 'true', '质控缺陷一票否决归档', 1),
('WATERMARK_TEMPLATE', '山一大消化病医院-工号:{badge}-{time}', '在线调阅动态水印规则', 0),
('MAX_BORROW_DAYS', '7', '科研借阅最大有效天数', 0);

INSERT INTO sd_mr_bid_users (id, username, password_hash, real_name, role, department, badge_no) VALUES
('u_admin', 'admin', '$2a$12$placeholderHashAdmin2026', '系统管理员', 'SUPER_ADMIN', '信息科', 'SYS001'),
('u_arch', 'archivist', '$2a$12$placeholderHashArch2026', '赵雅琴', 'ARCHIVIST', '病案管理科', 'MR002'),
('u_doc1', 'doctor', '$2a$12$placeholderHashDoc2026', '李志刚', 'CLINICIAN', '消化内科一区', 'DOC108'),
('u_audit', 'auditor', '$2a$12$placeholderHashAudit2026', '王督查', 'AUDITOR', '医疗质控科', 'QC991'),
('u_res', 'researcher', '$2a$12$placeholderHashRes2026', '周研', 'RESEARCHER', '科研处', 'RS017');

INSERT INTO sd_mr_bid_medical_records (id, mr_number, patient_name, patient_id_card, gender, age, admission_date, discharge_date, dept_name, attending_doctor, icd10_code, diagnosis_name, archive_status, pdf_r2_url, digital_hash, ca_sign_status, page_count) VALUES
('mr_001', 'MR2026081401', '张*强', '37080219800101****', '男', 46, '2026-08-01 09:30:00', '2026-08-10 14:00:00', '消化内科一区', '李志刚', 'K29.500', '慢性萎缩性胃炎伴肠化生', 'ARCHIVED_LOCKED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_001.pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1, 38),
('mr_002', 'MR2026081402', '刘*芳', '37080219750512****', '女', 51, '2026-08-05 11:15:00', '2026-08-12 10:00:00', '内镜微创中心', '孙建国', 'K63.501', '结肠息肉内镜下高频电切术后', 'DEPT_CHECKED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_002.pdf', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 1, 24),
('mr_003', 'MR2026081403', '王*山', '37080219620920****', '男', 64, '2026-08-08 14:20:00', '2026-08-14 09:30:00', '消化内科二区', '陈明', 'K25.300', '急性胃溃疡伴活动性出血', 'QC_REJECTED', NULL, NULL, 0, 42),
('mr_004', 'MR2026081501', '赵*敏', '37081119881203****', '女', 38, '2026-08-06 08:40:00', '2026-08-13 11:20:00', '消化内科一区', '李志刚', 'K51.900', '溃疡性结肠炎（缓解期）', 'CONVERTED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_004.pdf', '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3', 1, 31),
('mr_005', 'MR2026081502', '孙*平', '37010219701118****', '男', 56, '2026-08-04 15:10:00', '2026-08-11 16:45:00', '肝病内科', '周海燕', 'K76.000', '非酒精性脂肪性肝病', 'PENDING_CONVERT', NULL, NULL, 0, 18),
('mr_006', 'MR2026081503', '周*安', '37081319650822****', '男', 61, '2026-07-28 10:05:00', '2026-08-09 09:00:00', '普外科胃肠组', '刘文博', 'C16.201', '早期胃癌 ESD 术后', 'ARCHIVED_LOCKED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_006.pdf', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 1, 56),
('mr_007', 'MR2026081601', '吴*梅', '37081219830509****', '女', 43, '2026-08-09 13:22:00', '2026-08-15 10:30:00', '内镜微创中心', '孙建国', 'K21.000', '胃食管反流病', 'DEPT_CHECKED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_007.pdf', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', 1, 21),
('mr_008', 'MR2026081602', '郑*华', '37010219691127****', '男', 57, '2026-08-10 07:50:00', '2026-08-16 15:10:00', '消化内科二区', '陈明', 'K80.200', '胆囊结石伴慢性胆囊炎', 'CONVERTED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_008.pdf', '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', 0, 29),
('mr_009', 'MR2026081701', '冯*丽', '37080219920416****', '女', 34, '2026-08-12 09:18:00', '2026-08-16 11:00:00', '消化内科一区', '李志刚', 'K58.900', '肠易激综合征', 'PENDING_CONVERT', NULL, NULL, 0, 16),
('mr_010', 'MR2026081702', '黄*杰', '37081119780801****', '男', 48, '2026-08-02 16:40:00', '2026-08-08 14:20:00', '肝病内科', '周海燕', 'B18.101', '慢性乙型病毒性肝炎', 'ARCHIVED_LOCKED', 'https://26-sd-mr-bid-assets.softwarelink.net/mr_010.pdf', 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683', 1, 44);

INSERT INTO sd_mr_bid_qc_records (id, mr_id, qc_level, qc_doctor_id, qc_doctor_name, result, defect_type, defect_comment, created_at) VALUES
('qc_001', 'mr_001', 'DEPT_LEVEL', 'u_doc1', '李志刚', 'PASSED', NULL, '科室自查文书完整、签名齐全', '2026-08-11 09:12:00'),
('qc_002', 'mr_001', 'ARCHIVE_LEVEL', 'u_arch', '赵雅琴', 'PASSED', NULL, '终检通过，PDF/A 与 CA 指纹一致，予以封存', '2026-08-11 16:40:00'),
('qc_003', 'mr_002', 'DEPT_LEVEL', 'u_doc1', '李志刚', 'PASSED', NULL, '内镜报告与病理已归档', '2026-08-13 10:08:00'),
('qc_004', 'mr_003', 'DEPT_LEVEL', 'u_doc1', '李志刚', 'PASSED', NULL, '科室已补病程，提交病案室', '2026-08-14 18:22:00'),
('qc_005', 'mr_003', 'ARCHIVE_LEVEL', 'u_arch', '赵雅琴', 'REJECTED', '缺失知情同意书', '输血知情同意书扫描件缺失，请于 24 小时内补扫后重提', '2026-08-15 09:05:00'),
('qc_006', 'mr_006', 'ARCHIVE_LEVEL', 'u_arch', '赵雅琴', 'PASSED', NULL, 'ESD 术后病案甲级，哈希已固化', '2026-08-10 14:18:00'),
('qc_007', 'mr_007', 'DEPT_LEVEL', 'u_doc1', '李志刚', 'PASSED', NULL, '反流病随访记录完整', '2026-08-16 08:40:00'),
('qc_008', 'mr_008', 'DEPT_LEVEL', 'u_doc1', '李志刚', 'REJECTED', '漏填主诉', '入院记录主诉未填写，已退回主管医师', '2026-08-16 17:11:00');

INSERT INTO sd_mr_bid_borrow_requests (id, mr_id, applicant_id, applicant_name, purpose, status, start_time, end_time, watermark_text, created_at) VALUES
('br_001', 'mr_001', 'u_res', '周研', 'TEACHING_RESEARCH', 'APPROVED', '2026-08-15 00:00:00', '2026-08-22 23:59:59', '山一大消化病医院-工号:RS017-科研调阅', '2026-08-14 16:20:00'),
('br_002', 'mr_006', 'u_res', '周研', 'TEACHING_RESEARCH', 'PENDING', NULL, NULL, NULL, '2026-08-16 11:05:00'),
('br_003', 'mr_010', 'u_audit', '王督查', 'LEGAL_DISPUTE', 'APPROVED', '2026-08-16 09:00:00', '2026-08-18 18:00:00', '山一大消化病医院-工号:QC991-法务调阅', '2026-08-16 08:50:00'),
('br_004', 'mr_002', 'u_doc1', '李志刚', 'CLINICAL_TREATMENT', 'EXPIRED', '2026-08-01 00:00:00', '2026-08-08 23:59:59', '山一大消化病医院-工号:DOC108-临床调阅', '2026-08-01 09:00:00');

INSERT INTO sd_mr_bid_audit_logs (id, user_id, user_name, action, target_resource, ip_address, user_agent, created_at) VALUES
('aud_001', 'u_admin', '系统管理员', 'LOGIN', 'auth', '10.12.1.2', 'Mozilla/5.0 Console', '2026-08-14 08:01:12'),
('aud_002', 'u_arch', '赵雅琴', 'SIGN_VERIFY', 'mr_001', '10.12.8.8', 'Mozilla/5.0 ArchiveDesk', '2026-08-11 16:41:03'),
('aud_003', 'u_arch', '赵雅琴', 'REJECT_QC', 'mr_003', '10.12.8.8', 'Mozilla/5.0 ArchiveDesk', '2026-08-15 09:05:22'),
('aud_004', 'u_res', '周研', 'VIEW_RECORD', 'mr_001', '10.18.4.21', 'Mozilla/5.0 ResearchPad', '2026-08-16 10:12:44'),
('aud_005', 'u_doc1', '李志刚', 'CONVERT_PDF', 'mr_004', '10.12.8.21', 'Mozilla/5.0 WardStation', '2026-08-15 11:33:09'),
('aud_006', 'u_audit', '王督查', 'DOWNLOAD_PDF', 'mr_010', '10.12.8.90', 'Mozilla/5.0 AuditBox', '2026-08-16 09:18:00'),
('aud_007', 'u_admin', '系统管理员', 'UPDATE_CONFIG', 'AUTO_CONVERT_ENABLED', '10.12.1.2', 'Mozilla/5.0 Console', '2026-08-14 08:12:00');
