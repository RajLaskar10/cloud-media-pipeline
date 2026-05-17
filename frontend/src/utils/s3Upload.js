export async function uploadFiles(files, uploadUrls, onProgress) {
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
}
