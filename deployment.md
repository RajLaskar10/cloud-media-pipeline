# Deployment Guide

MVP workflow: build → screenshot for portfolio → tear down everything. This guide covers both directions.

---

## Prerequisites

- AWS account with billing alerts enabled
- AWS CLI installed and configured: `aws configure` (region: `us-east-1`)
- Pick a unique 6-character suffix (e.g. your initials + 3 digits: `rl0042`) — used in all resource names
- Node.js 18+ for the frontend

---

## Step 0 — AWS Budgets safety net (do this first)

Set up a $1 monthly budget with email alerts before creating any resources. If you forget to tear down, this pages you before any real spend.

1. AWS Console → **Billing → Budgets → Create budget**
2. Template: *Monthly cost budget*
3. Amount: `$1.00`
4. Alert thresholds: `80%` and `100%` → your email
5. Create budget

This service is free.

---

## Build Order

### 1. S3 buckets

See `infra/s3-setup.md`.

Key settings to confirm:
- Block All Public Access: **ON** on both buckets
- **No versioning** (versioning doubles storage costs)
- Lifecycle rules active: input bucket deletes after **7 days**, output after **30 days**

### 2. IAM roles

See `infra/lambda-setup.md` (IAM section).

Create two roles:
- `cloud-media-upload-url-role` — `s3:PutObject` on `arn:aws:s3:::cloud-media-input-{suffix}/jobs/*`
- `cloud-media-process-role` — `s3:GetObject` + `s3:ListBucket` on input, `s3:PutObject` on output

### 3. FFmpeg Lambda Layer

See `lambda/layers/README.md`.

Prefer the **public community ARN** (no build required, stays within free tier). Attach to `process_media` in step 5.

### 4. `generate_upload_url` Lambda

See `infra/lambda-setup.md`.

- Runtime: Python 3.11, x86_64
- Memory: **256 MB**, Timeout: **10 s**
- Env vars: `INPUT_BUCKET`, `ALLOWED_ORIGIN`, `AWS_REGION=us-east-1`

### 5. `process_media` Lambda

See `infra/lambda-setup.md`.

- Runtime: Python 3.11, x86_64
- Memory: **1024 MB**, Timeout: **300 s**, Ephemeral storage: **2048 MB**
- Attach FFmpeg layer from step 3
- Env vars: `INPUT_BUCKET`, `OUTPUT_BUCKET`

**Immediately after creating this function**, set CloudWatch log retention:

```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/process_media \
  --retention-in-days 7
```

Repeat for `generate_upload_url`:

```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/generate_upload_url \
  --retention-in-days 7
```

The default is "never expire" — logs accumulate forever and generate ongoing storage charges.

### 6. S3 → Lambda trigger

See `infra/s3-setup.md` (event notification section).

- Bucket: input
- Event: `ObjectCreated`
- Prefix: `jobs/`, Suffix: `.jpg`
- Destination: `process_media` Lambda

### 7. API Gateway HTTP API

See `infra/apigateway-setup.md`.

- Type: **HTTP API** (not REST — cheaper and lower latency)
- Route: `POST /upload-url` → `generate_upload_url` Lambda
- CORS: allow `http://localhost:5173` + your CloudFront domain

### 8. CloudFront distribution

See `infra/cloudfront-setup.md`.

- Origin: output S3 bucket via OAC
- Viewer protocol: Redirect HTTP → HTTPS
- **Price Class: `PriceClass_100` (US, Canada, Europe only)** — set this under *Distribution settings → Price class* to minimize edge footprint

### 9. CloudWatch monitoring

See `docs/cloudwatch-setup.md`.

- Dashboard: `cloud-media-pipeline`
- 3 alarms on `process_media`: Errors, Duration p95 ≥ 240 s, Throttles
- SNS topic + email subscription for alerts

All within free-tier limits (≤ 3 dashboards, ≤ 10 alarms).

### 10. Wire the frontend

Copy the env template and fill in the values from steps 7–8:

```bash
cd frontend
cp ../.env.example .env
# Edit .env:
# VITE_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com
# VITE_CLOUDFRONT_URL=https://<distribution-id>.cloudfront.net
npm install
npm run dev
```

For the MVP, running locally (`npm run dev`) is sufficient — no need to host the frontend.

---

## Free-Tier Checklist

Confirm before walking away from the console:

- [ ] Region is `us-east-1` for all resources
- [ ] CloudFront price class is `PriceClass_100`
- [ ] `/aws/lambda/process_media` log group retention = 7 days
- [ ] `/aws/lambda/generate_upload_url` log group retention = 7 days
- [ ] S3 lifecycle rules active (7 d input, 30 d output)
- [ ] No S3 versioning enabled on either bucket
- [ ] AWS Budgets $1 alarm is active and confirmed via email
- [ ] Lambdas are **not** inside a VPC (no NAT Gateway charges)

---

## Screenshot Checklist

Capture these before teardown:

- [ ] Architecture diagram (`docs/architecture.md` or README)
- [ ] AWS Lambda console — both functions (config, memory, timeout, layer)
- [ ] S3 console — both buckets (lifecycle rules, event notification)
- [ ] API Gateway console — route, integration, CORS
- [ ] CloudFront console — distribution settings, price class
- [ ] CloudWatch dashboard — `cloud-media-pipeline`
- [ ] Frontend in browser — upload zone, job status, video player
- [ ] Sample output video playing via CloudFront URL

---

## Teardown Order

Delete in reverse dependency order. Log groups must be deleted explicitly — they are NOT removed when you delete the Lambda function.

- [ ] **CloudFront** — disable the distribution first, wait ~15 minutes for the change to deploy, then delete. (AWS blocks deletion of enabled distributions.)
- [ ] **API Gateway** — delete the HTTP API.
- [ ] **Lambda functions** — delete `process_media`, then `generate_upload_url`.
- [ ] **Lambda layer** — delete the FFmpeg layer version.
- [ ] **S3 buckets** — empty each bucket first, then delete:
  ```bash
  aws s3 rm s3://cloud-media-input-{suffix} --recursive
  aws s3 rb s3://cloud-media-input-{suffix}
  aws s3 rm s3://cloud-media-output-{suffix} --recursive
  aws s3 rb s3://cloud-media-output-{suffix}
  ```
- [ ] **CloudWatch** — delete the `cloud-media-pipeline` dashboard, all 3 alarms, and both log groups:
  ```bash
  aws logs delete-log-group --log-group-name /aws/lambda/process_media
  aws logs delete-log-group --log-group-name /aws/lambda/generate_upload_url
  ```
- [ ] **SNS** — delete the topic and email subscription.
- [ ] **IAM** — detach and delete both Lambda execution policies, then delete both roles.
- [ ] **AWS Budgets** — optional: leave active as a safety net, or delete.

---

## Verify Zero Spend

After teardown:

1. AWS Console → **Billing → Cost Explorer** → set date range to current month → confirm near-$0 usage
2. **Billing → Free Tier** → review usage vs. limits for Lambda, S3, API Gateway, CloudFront
3. **Billing → Bills** → expand each service line to confirm no unexpected charges
