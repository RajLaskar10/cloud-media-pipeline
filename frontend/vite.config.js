import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware that simulates the Lambda API and S3 upload endpoints
// so the upload flow can be tested without real AWS infrastructure.
function mockApiPlugin() {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/upload-url') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            const { file_count = 1 } = JSON.parse(body || '{}')
            const job_id = `mock-${Date.now()}`
            const upload_urls = Array.from({ length: file_count }, (_, i) => ({
              index: i,
              key: `jobs/${job_id}/input_${String(i).padStart(4, '0')}.jpg`,
              url: `http://${req.headers.host}/mock-upload/${i}`,
            }))
            const trigger_url = `http://${req.headers.host}/mock-trigger`
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ job_id, upload_urls, trigger_url }))
          })
          return
        }

        if (req.method === 'PUT' && (req.url?.startsWith('/mock-upload/') || req.url === '/mock-trigger')) {
          res.writeHead(200)
          res.end()
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
})
