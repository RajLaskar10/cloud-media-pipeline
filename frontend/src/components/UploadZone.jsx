import { useState, useRef } from 'react'
import { getUploadUrls } from '../utils/api'
import { uploadFiles } from '../utils/s3Upload'

export default function UploadZone({ onComplete, onError }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  function handleFiles(incoming) {
    const jpegs = Array.from(incoming).filter(
      (f) => f.type === 'image/jpeg' || f.name.toLowerCase().endsWith('.jpg'),
    )
    setFiles(jpegs)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleSubmit() {
    if (!files.length) return
    setUploading(true)
    setProgress(0)
    try {
      const { job_id, upload_urls, trigger_url } = await getUploadUrls(files.length)
      await uploadFiles(files, upload_urls, trigger_url, setProgress)
      onComplete(job_id)
    } catch (err) {
      onError(err.message || 'Upload failed')
      setUploading(false)
    }
  }

  if (uploading) {
    const pct = Math.round(progress * 100)
    return (
      <div className="w-full max-w-lg text-center">
        <p className="text-gray-300 mb-4">
          Uploading {files.length} image{files.length !== 1 ? 's' : ''}…
        </p>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">{pct}%</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      <div
        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors select-none ${
          dragOver
            ? 'border-blue-400 bg-blue-950/40'
            : 'border-gray-600 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          className="w-12 h-12 text-gray-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        {files.length === 0 ? (
          <>
            <p className="text-gray-300 font-medium">Drop JPEG images here</p>
            <p className="text-gray-500 text-sm mt-1">or click to select files</p>
          </>
        ) : (
          <>
            <p className="text-gray-200 font-medium">
              {files.length} image{files.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-gray-500 text-sm mt-1">Click to change selection</p>
          </>
        )}
      </div>

      <button
        disabled={files.length === 0}
        onClick={handleSubmit}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        Create Video
      </button>
    </div>
  )
}
