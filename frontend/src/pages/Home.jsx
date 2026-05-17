import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import JobStatus from '../components/JobStatus'
import VideoPlayer from '../components/VideoPlayer'

export default function Home() {
  const [phase, setPhase] = useState('idle') // idle | processing | done | error
  const [jobId, setJobId] = useState(null)
  const [error, setError] = useState(null)

  function handleComplete(id) {
    setJobId(id)
    setPhase('processing')
  }

  function handleError(msg) {
    setError(msg)
    setPhase('error')
  }

  function reset() {
    setPhase('idle')
    setJobId(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-20 px-4">
      <h1 className="text-4xl font-bold mb-2">Cloud Media Pipeline</h1>
      <p className="text-gray-400 mb-14 text-center">
        Upload JPEG images and get back an MP4 video — serverless on AWS.
      </p>

      {phase === 'idle' && (
        <UploadZone onComplete={handleComplete} onError={handleError} />
      )}

      {phase === 'processing' && (
        <JobStatus jobId={jobId} onReady={() => setPhase('done')} />
      )}

      {phase === 'done' && (
        <>
          <VideoPlayer jobId={jobId} />
          <button
            onClick={reset}
            className="mt-8 text-gray-500 hover:text-gray-300 text-sm underline"
          >
            Upload more images
          </button>
        </>
      )}

      {phase === 'error' && (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={reset}
            className="text-gray-500 hover:text-gray-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  )
}
