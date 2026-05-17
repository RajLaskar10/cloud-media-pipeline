const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL

export default function VideoPlayer({ jobId }) {
  const videoUrl = `${CLOUDFRONT_URL}/jobs/${jobId}/output.mp4`

  return (
    <div className="w-full max-w-2xl">
      <video
        src={videoUrl}
        controls
        autoPlay
        className="w-full rounded-xl bg-black"
      />
      <div className="text-center mt-3">
        <a
          href={videoUrl}
          download="output.mp4"
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Download video
        </a>
      </div>
    </div>
  )
}
