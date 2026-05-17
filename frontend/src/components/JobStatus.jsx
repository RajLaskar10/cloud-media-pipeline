import { useEffect } from 'react'

const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL

export default function JobStatus({ jobId, onReady }) {
  useEffect(() => {
    if (!jobId) return
    const videoUrl = `${CLOUDFRONT_URL}/jobs/${jobId}/output.mp4`
    let timeoutId

    function poll() {
      const probe = document.createElement('video')
      probe.onloadedmetadata = () => onReady()
      probe.onerror = () => {
        timeoutId = setTimeout(poll, 5000)
      }
      probe.src = videoUrl
    }

    poll()
    return () => clearTimeout(timeoutId)
  }, [jobId, onReady])

  return (
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
      <p className="text-gray-200 font-medium">Processing your video…</p>
      <p className="text-gray-500 text-sm mt-2">
        FFmpeg is stitching your images on AWS Lambda
      </p>
      <p className="text-gray-700 text-xs mt-6 font-mono">{jobId}</p>
    </div>
  )
}
