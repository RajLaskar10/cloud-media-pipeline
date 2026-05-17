export async function uploadFiles(files, uploadUrls, triggerUrl, onProgress) {
  let completed = 0
  await Promise.all(
    files.map(async (file, i) => {
      const res = await fetch(uploadUrls[i].url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: file,
      })
      if (!res.ok) throw new Error(`Failed to upload image ${i + 1}`)
      onProgress?.(++completed / files.length)
    })
  )
  // All images are in S3 — fire the trigger so Lambda processes the complete set
  const res = await fetch(triggerUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: files.length }),
  })
  if (!res.ok) throw new Error('Failed to trigger processing')
}
