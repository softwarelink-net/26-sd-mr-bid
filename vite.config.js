import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const sqlitePath = join(root, 'public/data/site.sqlite')

function sqliteDevMiddleware() {
  return {
    name: 'sqlite-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/data/site.sqlite', (req, res, next) => {
        if (req.method === 'GET') return next()
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          return res.end()
        }
        if (req.method !== 'PUT') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          mkdirSync(dirname(sqlitePath), { recursive: true })
          writeFileSync(sqlitePath, Buffer.concat(chunks))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), sqliteDevMiddleware()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts'],
          sqljs: ['sql.js'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['sql.js'],
  },
})
