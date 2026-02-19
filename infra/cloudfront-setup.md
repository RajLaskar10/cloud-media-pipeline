# CloudFront Setup (Output Video Delivery)

This distribution serves processed videos from the output S3 bucket.

## Steps

1. AWS Console → CloudFront → Create Distribution
2. Origin: `cloud-media-output-{your-id}` S3 bucket
3. Origin Access: "Origin access control (recommended)" → create new OAC
4. Viewer protocol policy: Redirect HTTP to HTTPS
5. Cache policy: `CachingOptimized` (videos don't change after creation)
6. No default root object needed

## Update Output Bucket Policy

After creating the distribution, copy the generated bucket policy and apply it to `cloud-media-output-{your-id}`. This gives CloudFront read access to the private bucket.

## Get Your Domain

CloudFront gives you a domain like:
```
https://d1abc123xyz.cloudfront.net
```

A video output at `s3://cloud-media-output/jobs/{job_id}/output.mp4` becomes:
```
https://d1abc123xyz.cloudfront.net/jobs/{job_id}/output.mp4
```

Set this base URL as `VITE_CLOUDFRONT_URL` in your frontend `.env`.

## Frontend Usage

After a job is processed, the frontend constructs the video URL:
```js
const videoUrl = `${import.meta.env.VITE_CLOUDFRONT_URL}/jobs/${jobId}/output.mp4`
```

Poll for this URL's availability (HTTP 200) to detect when processing is complete.
