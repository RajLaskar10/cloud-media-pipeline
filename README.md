# Cloud Media Processing Pipeline

A serverless, event-driven media processing pipeline on AWS. Users upload images via a React frontend, which triggers an automated Lambda-based conversion pipeline that stitches images into a video using FFmpeg and delivers the output via CloudFront CDN.

## Why This Is Interesting Engineering

The conversion itself is straightforward. The architecture is not. This pipeline is fully serverless — no EC2, no always-on server. An S3 event triggers Lambda, Lambda runs FFmpeg, output lands in a separate S3 bucket, and CloudFront serves it. Every step is measurable via CloudWatch, giving real benchmark data for performance claims.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TailwindCSS |
| Upload | AWS S3 Pre-signed URLs (direct browser → S3, no backend bottleneck) |
| Trigger | S3 Event Notification → Lambda |
| Processing | AWS Lambda (Python 3.11) + FFmpeg Lambda Layer |
| Storage | S3 input bucket + S3 output bucket (separate for IAM clarity) |
| Delivery | AWS CloudFront (output video CDN) |
| API | AWS API Gateway + Lambda (pre-signed URL generation) |
| Monitoring | AWS CloudWatch (logs, metrics, alarms) |

## Architecture

```
[React Frontend]
      |
      | 1. Request pre-signed upload URL
      v
[API Gateway] → [Lambda: generate_upload_url]
      |
      | 2. Returns pre-signed S3 URL
      v
[React Frontend]
      |
      | 3. Direct upload to S3 (no backend in the loop)
      v
[S3: input-bucket]
      |
      | 4. S3 Event Notification (ObjectCreated)
      v
[Lambda: process_media]
      |  - Downloads images from input bucket
      |  - Runs FFmpeg (Lambda Layer) to stitch into video
      |  - Uploads output .mp4 to output bucket
      v
[S3: output-bucket]
      |
      | 5. CloudFront serves output video
      v
[User downloads/streams video]
      |
[CloudWatch] ← logs + metrics from every Lambda invocation
```

## Key Design Decisions

See `/docs/architecture.md` for full rationale. Short version:
- **Pre-signed URLs** — browser uploads directly to S3, Lambda never handles raw file bytes. Removes a bottleneck and keeps Lambda fast.
- **Separate input/output buckets** — cleaner IAM policies, avoids accidental re-triggering of Lambda on output writes.
- **FFmpeg as a Lambda Layer** — keeps the deployment package small, layer is reusable across functions.
- **CloudWatch alarms** — Lambda timeout and error rate alarms mean you know immediately when something breaks.

## Project Structure

```
cloud-media-pipeline/
├── frontend/                        # React upload UI
│   └── src/
│       ├── components/
│       │   ├── UploadZone.jsx       # Drag-and-drop image upload
│       │   ├── JobStatus.jsx        # Polling for processing completion
│       │   └── VideoPlayer.jsx      # Preview + download output video
│       ├── pages/
│       │   └── Home.jsx
│       └── utils/
│           ├── api.js               # API Gateway calls
│           └── s3Upload.js          # Direct-to-S3 upload logic
│
├── lambda/
│   ├── generate_upload_url/
│   │   └── handler.py               # Generates S3 pre-signed PUT URL
│   ├── process_media/
│   │   └── handler.py               # S3-triggered FFmpeg processing
│   └── layers/
│       └── README.md                # How to build + attach FFmpeg layer
│
├── infra/
│   ├── s3-setup.md                  # Bucket config, CORS, event notifications
│   ├── lambda-setup.md              # Lambda config, IAM roles, env vars
│   ├── apigateway-setup.md          # API Gateway routes + CORS
│   └── cloudfront-setup.md          # CloudFront distribution for output bucket
│
├── docs/
│   ├── architecture.md              # Design decisions + tradeoffs
│   ├── benchmarks.md                # CloudWatch-based performance data (fill in after building)
│   └── cloudwatch-setup.md          # Dashboards, alarms, log insights queries
│
└── .env.example                     # Frontend environment variables
```

## Getting Started

### Prerequisites
- AWS account with appropriate IAM permissions
- Node.js 18+ (frontend)
- Python 3.11+ (Lambda local testing)
- AWS CLI configured (`aws configure`)

### Local Frontend Setup

```bash
cd frontend
cp ../.env.example .env
npm install
npm run dev
```

### Deploy Lambda Functions

See `/infra/lambda-setup.md` for full deployment steps.

### Environment Variables

See `.env.example`:
- `VITE_API_BASE_URL` — API Gateway endpoint
- `VITE_CLOUDFRONT_URL` — CloudFront distribution URL for output videos

## Resume Bullet Points (reference)

- Architected a serverless event-driven media pipeline on AWS — S3 upload triggers Lambda processing via FFmpeg Layer, output delivered through CloudFront CDN with zero always-on infrastructure
- Implemented direct browser-to-S3 uploads via pre-signed URLs, eliminating backend as a file transfer bottleneck and reducing upload latency
- Configured CloudWatch dashboards and alarms to monitor Lambda duration, error rate, and memory utilization; used metrics to benchmark processing performance
- Separated input/output S3 buckets with scoped IAM policies to prevent Lambda re-trigger loops and enforce least-privilege access
