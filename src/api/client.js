/** 浏览器 sql.js 数据访问层 — 登录与业务均读写 R2 SQLite */
import { isDbReady } from '@/db/engine'
import * as repo from '@/db/repository'

function ensureDb() {
  if (!isDbReady()) throw new Error('数据库尚未就绪，请稍候刷新')
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('sdmr_user') || 'null')
  } catch {
    return null
  }
}

export const DEMO_PASSWORDS = repo.DEMO_PASSWORDS
export const DEPTS = repo.DEPTS
export const DEFECTS = repo.DEFECTS

export async function login(username, password) {
  ensureDb()
  return repo.loginUser(username, password)
}

export async function fetchStats() {
  ensureDb()
  return repo.fetchStats(currentUser())
}

export async function fetchRecords(params = {}) {
  ensureDb()
  return repo.fetchRecords(params, currentUser())
}

export async function fetchArchiveQueue() {
  ensureDb()
  return repo.fetchArchiveQueue()
}

export async function convertArchive(ids) {
  ensureDb()
  return repo.convertArchive(ids)
}

export async function fetchQc() {
  ensureDb()
  return repo.fetchQc()
}

export async function submitQc(payload) {
  ensureDb()
  return repo.submitQc(payload, currentUser())
}

export async function fetchBorrows() {
  ensureDb()
  return repo.fetchBorrows(currentUser())
}

export async function applyBorrow(payload) {
  ensureDb()
  const user = currentUser()
  return repo.applyBorrow({ ...payload, applicant_id: user?.id, applicant_name: user?.real_name }, user)
}

export async function reviewBorrow(id, status) {
  ensureDb()
  return repo.reviewBorrow(id, status, currentUser())
}

export async function verifyCa(id) {
  ensureDb()
  return repo.verifyCa(id, currentUser())
}

export async function recomputeHash(payload) {
  ensureDb()
  return repo.recomputeHash(payload)
}

export async function fetchSystem() {
  ensureDb()
  return repo.fetchSystem(currentUser())
}

export async function updateConfig(config_key, config_value) {
  ensureDb()
  return repo.updateConfig(config_key, config_value, currentUser())
}
