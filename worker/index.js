/**
 * Cloudflare Worker — allworld（静态 + 每站 R2 SQLite 二进制读写）
 * 无 /api 业务接口：登录与 CRUD 均在浏览器 sql.js 完成。
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function siteIdFromHost(hostname, rootDomain) {
  const host = hostname.toLowerCase()
  const root = rootDomain.toLowerCase()
  if (host === root) return '_root'
  if (host === `www.${root}`) return 'www'
  if (host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1))
  return host
}

function contentTypeFor(path) {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const map = {
    html: 'text/html; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    json: 'application/json; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    sqlite: 'application/x-sqlite3',
    wasm: 'application/wasm',
  }
  return map[ext] || 'application/octet-stream'
}

async function handleSqliteBlob(request, env, siteId, pathname) {
  if (!pathname.startsWith('/data/') || !pathname.endsWith('.sqlite')) return null
  const key = `${siteId}${pathname}`

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (request.method === 'GET') {
    const obj = await env.SITES.get(key)
    if (!obj) return new Response('Not Found', { status: 404, headers: CORS })
    return new Response(obj.body, {
      headers: {
        ...CORS,
        'Content-Type': obj.httpMetadata?.contentType || 'application/x-sqlite3',
      },
    })
  }

  if (request.method === 'PUT') {
    const body = await request.arrayBuffer()
    await env.SITES.put(key, body, {
      httpMetadata: { contentType: 'application/x-sqlite3' },
    })
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  return new Response('Method Not Allowed', { status: 405, headers: CORS })
}

async function serveR2Site(request, env) {
  const url = new URL(request.url)
  const siteId = siteIdFromHost(url.hostname, env.ROOT_DOMAIN || 'softwarelink.net')

  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/')) pathname += 'index.html'
  if (pathname === '') pathname = '/index.html'

  const sqlite = await handleSqliteBlob(request, env, siteId, pathname)
  if (sqlite) return sqlite

  const candidates = [
    `${siteId}${pathname}`,
    `${siteId}${pathname}.html`,
    `${siteId}${pathname}/index.html`,
    `${siteId}/index.html`,
  ]

  for (const key of candidates) {
    const obj = await env.SITES.get(key)
    if (!obj) continue
    return new Response(obj.body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType || contentTypeFor(key),
      },
    })
  }

  if (!pathname.split('/').pop()?.includes('.')) {
    const indexObj = await env.SITES.get(`${siteId}/index.html`)
    if (indexObj) {
      return new Response(indexObj.body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
  }

  return new Response(`${siteId} 尚无静态文件`, { status: 404 })
}

export default {
  async fetch(request, env) {
    try {
      return await serveR2Site(request, env)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
      })
    }
  },
}
