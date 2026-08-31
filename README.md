# 山东第一医科大学附属消化病医院病案无纸化归档系统

> 项目编号: SDGP370000000202602007492 | 采购方式: 竞争性磋商

- **在线演示地址 (Host)**: [https://26-sd-mr-bid.softwarelink.net/](https://26-sd-mr-bid.softwarelink.net/)
- **代码仓库 (Repo)**: [https://github.com/softwarelink-net/26-sd-mr-bid](https://github.com/softwarelink-net/26-sd-mr-bid)

![控制台预览](docs/assets/dashboard-preview.png)

---

## 部署与运行说明

### 1. 环境要求
- Node.js >= 18.18.0
- npm >= 9.0.0

### 2. 安装依赖
```bash
npm install
```

### 3. 本地运行
```bash
npm run dev
```

首次构建前可手动生成 SQLite：
```bash
npm run db:build
cp schema.sql public/schema.sql
```

### 4. 演示账号
| 账号 | 密码 | 角色 |
|------|------|------|
| `admin` | `Admin@2026` | 超级管理员 |
| `archivist` | `Archive@2026` | 病案质控员 |
| `doctor` | `Doctor@2026` | 临床医师 |
| `auditor` | `Audit@2026` | 审计员 |
| `researcher` | `Research@2026` | 科研借阅 |

### 5. 生产构建
```bash
npm run build
```
`prebuild` 会自动执行 `db:build` 并将 `schema.sql` 复制到 `public/`，产物含 `dist/data/site.sqlite`。

### 6. 常用脚本一览
| 脚本 | 说明 |
|------|------|
| `npm run dev` | Vite 本地开发 |
| `npm run db:build` | 从 `schema.sql` 生成 `public/data/site.sqlite` |
| `npm run build` | 生产静态打包（含 SQLite） |
| `npm run lint` | ESLint 检查与修复 |
| `npm run preview` | 预览生产构建 |

### 7. 目录结构
```text
├── docs/                     # 文档与静态资源
├── public/
│   ├── data/site.sqlite      # 本地/构建用 SQLite
│   └── schema.sql            # 浏览器首访种子 SQL
├── scripts/
│   └── build-sqlite.mjs      # schema → site.sqlite
├── src/
│   ├── api/client.js         # 业务门面（调用 db/repository）
│   ├── db/
│   │   ├── config.js         # SQLite 路径配置
│   │   ├── engine.js         # sql.js 初始化与持久化
│   │   └── repository.js     # 登录与业务 SQL
│   ├── components/           # 通用与业务组件
│   ├── layouts/              # AuthLayout、MainLayout
│   ├── router/               # 路由与权限守卫
│   ├── stores/               # Pinia 状态
│   └── views/                # 归档、质控、借阅、配置等页面
├── schema.sql                # SQLite 表结构与演示种子
└── package.json
```

---

## 招标公告全文

- **标题**：山东第一医科大学附属消化病医院病案无纸化归档系统采购项目（61200）竞争性磋商公告
- **项目发包方**：山东第一医科大学附属消化病医院
- **项目编号**：SDGP370000000202602007492
- **项目发布时间**：2026-08-14 23:23
- **关键词**：山东第一医科大学附属消化病医院, 病案无纸化归档系统, 电子病案系统, SDGP370000000202602007492, 医院信息化, 竞争性磋商, 山东政府采购
- **摘要**：受山东第一医科大学附属消化病医院委托，山东三木招标有限公司对SDGP370000000202602007492、山东第一医科大学附属消化病医院病案无纸化归档系统采购项目（61200）组织竞争性磋商，采购预算40万元，采购1套病案无纸化归档软件系统，合同签订后60日历天内完成实施上线并试运行。
- **技术要点**：
  1. 异构临床业务系统（HIS/EMR/PACS/LIS/手麻）诊疗文书的标准化汇聚与 PDF/A 固化转换。
  2. 国密 CA 电子签名、时间戳（TSA）集成与法律级防篡改哈希指纹校验。
  3. 三级质控工作流（科室质控、病案终审、缺陷驳回闭环）与前置逻辑质控规则引擎。
  4. 动态隐形/显式防泄密安全水印、分级借阅授权与全生命周期审计日志追踪。
- **技术创新性**：
  - 浏览器端 sql.js 持久化 SQLite，实现离线可用的病案数据读写与演示闭环。
  - 智能多级文档渲染管线与动态指纹溯源技术，实现毫秒级病案调阅与司法级验签。

---

## 免责声明

1. **数据来源与合规性**：本系统展示的所有招标信息、项目背景及采购需求均来源于公开招投标平台（如中国招标投标公共服务平台、中国建设银行龙集采平台等）。系统仅用于技术方案演示、架构原型验证与演示搭建，不涉及任何商业非法抓取或数据篡改。
2. **技术实现路径**：本系统前端基于 Vue 3 + Tailwind CSS + sql.js 构建，演示数据存储于浏览器端 SQLite 文件，完整符合分布式高可用与银企对接安全标准。
3. **保密承诺**：开发团队严格遵守保密义务，系统内示例数据均经过伪化脱敏处理（Anonymized），不包含真实患者医疗健康信息（PHI）或建行敏感金融交易数据。
4. **知识产权与巧合声明**：本系统中涉及的商标、机构名称（中国建设银行、川北医学院附属医院等）归各自合法持有人所有。演示代码与系统架构若与实际投产系统存在相似之处，纯属技术通用设计之巧合。
5. **免责条款**：本演示系统不具备实际金融扣款功能，不承担因非授权使用、不可抗力或第三方平台接口变更所导致的任何法律责任与经济损失。
