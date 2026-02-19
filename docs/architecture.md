# Architecture & Design Decisions

## Why Serverless?

An EC2-based approach would require a running server waiting for upload events. For a media processing workload that's bursty (many jobs at once, or none for hours), serverless is a better fit — you pay only for actual processing time, and Lambda scales automatically.

## Why Pre-signed URLs Instead of Proxying Through Lambda?

The naive approach: frontend → Lambda → S3. The problem: Lambda has a 6MB payload limit on API Gateway, and a 10MB limit on direct invocation. Large image sets would fail. Worse, Lambda costs money per millisecond — sitting idle while a file transfers is wasteful.

Pre-signed URLs solve this: the backend generates a time-limited URL that lets the browser upload *directly to S3*. Lambda is never in the file transfer path. This is the standard pattern for S3 uploads in production systems.

## Why Separate Input and Output Buckets?

If you use one bucket and Lambda writes the output video back to it, S3 fires another ObjectCreated event, which triggers Lambda again — infinite loop. Separate buckets with separate event notifications avoids this entirely. It also makes IAM cleaner: the processing Lambda has read on input, write on output. Nothing else.

## Why FFmpeg as a Lambda Layer?

Lambda has a 250MB deployment package limit (unzipped). FFmpeg is ~70MB. Putting it in a Layer keeps the function package small and the layer is reusable across other functions. It also means you can update FFmpeg independently of your function code.

## Lambda Configuration Recommendations

- **Memory:** 1024MB minimum for FFmpeg. More memory = more CPU in Lambda. 3008MB is worth benchmarking for large jobs.
- **Timeout:** 5 minutes (300 seconds) for a typical job. Monitor actual duration in CloudWatch and adjust.
- **Ephemeral storage:** Default /tmp is 512MB. If processing large image sets, increase to 2GB in Lambda config.

## Tradeoffs & Limitations

- **Cold starts:** Lambda has cold start latency (~500ms for Python). For a media processing job that takes seconds, this is acceptable.
- **Lambda timeout ceiling:** 15 minutes max. For very large jobs (hundreds of images), you'd need to batch or use AWS Batch instead.
- **No job status polling yet:** The current MVP doesn't notify the frontend when processing completes. The frontend would need to poll S3 for the output file, or you could add SNS → API Gateway WebSocket for real-time updates.
