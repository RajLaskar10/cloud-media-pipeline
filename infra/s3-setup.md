# S3 Setup Guide

## Two Buckets Required

| Bucket | Purpose | Public Access |
|---|---|---|
| `cloud-media-input-{your-id}` | Receives uploaded images | Blocked |
| `cloud-media-output-{your-id}` | Stores processed videos | Blocked (served via CloudFront) |

Use a unique suffix to avoid S3 name conflicts.

---

## Input Bucket Setup

### 1. Create bucket
- Region: `us-east-1` (keep consistent with Lambda)
- Block all public access: ON

### 2. CORS Configuration
Required so the browser can upload directly via pre-signed URL:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-cloudfront-domain.cloudfront.net"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. S3 Event Notification
- Event type: `s3:ObjectCreated:*`
- Prefix filter: `jobs/`
- Suffix filter: `.jpg`
- Destination: Lambda function `process_media`

**Important:** Add this notification *after* creating the Lambda function, not before.

### 4. Lifecycle Rule (optional but recommended)
Auto-delete input files after 7 days to avoid storage costs:
- Prefix: `jobs/`
- Expiration: 7 days

---

## Output Bucket Setup

### 1. Create bucket
- Same region as input
- Block all public access: ON (CloudFront will serve it)

### 2. No CORS needed
CloudFront handles delivery — browser never directly accesses this bucket.

### 3. Lifecycle Rule
Auto-delete output videos after 30 days:
- Prefix: `jobs/`
- Expiration: 30 days
