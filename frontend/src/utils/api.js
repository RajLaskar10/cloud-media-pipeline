const API_URL = import.meta.env.VITE_API_URL

export async function getUploadUrls(fileCount) {
  const res = await fetch(`${API_URL}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_count: fileCount }),
  })
  if (!res.ok) throw new Error('Failed to get upload URLs')
  return res.json() // { job_id, upload_urls: [{ index, key, url }] }
}
