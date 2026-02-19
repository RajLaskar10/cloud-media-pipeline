# Lambda Setup Guide

## Function 1: generate_upload_url

### Create Function
- Runtime: Python 3.11
- Architecture: x86_64
- Memory: 256MB (this function does almost nothing — just S3 API calls)
- Timeout: 10 seconds

### IAM Role Permissions
Attach an inline policy allowing:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::cloud-media-input-{your-id}/jobs/*"
    }
  ]
}
```

### Environment Variables
```
INPUT_BUCKET=cloud-media-input-{your-id}
ALLOWED_ORIGIN=https://your-cloudfront-domain.cloudfront.net
AWS_REGION=us-east-1
```

### Deploy
```bash
cd lambda/generate_upload_url
zip function.zip handler.py
aws lambda update-function-code \
  --function-name generate_upload_url \
  --zip-file fileb://function.zip
```

---

## Function 2: process_media

### Create Function
- Runtime: Python 3.11
- Architecture: x86_64
- Memory: 1024MB minimum (FFmpeg is CPU-intensive — Lambda CPU scales with memory)
- Timeout: 300 seconds (5 minutes)
- Ephemeral storage (/tmp): 2048MB (images + output video need space)

### IAM Role Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::cloud-media-input-{your-id}",
        "arn:aws:s3:::cloud-media-input-{your-id}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::cloud-media-output-{your-id}/jobs/*"
    }
  ]
}
```

### Environment Variables
```
INPUT_BUCKET=cloud-media-input-{your-id}
OUTPUT_BUCKET=cloud-media-output-{your-id}
```

### Attach FFmpeg Layer
See `/lambda/layers/README.md` for how to build or source the FFmpeg layer. Attach it to this function before testing.

### S3 Trigger
- Add trigger: S3
- Bucket: `cloud-media-input-{your-id}`
- Event type: `ObjectCreated`
- Prefix: `jobs/`
- Suffix: `.jpg`

### Deploy
```bash
cd lambda/process_media
zip function.zip handler.py
aws lambda update-function-code \
  --function-name process_media \
  --zip-file fileb://function.zip
```

---

## Testing process_media Locally

Use AWS SAM or just invoke directly:
```bash
aws lambda invoke \
  --function-name process_media \
  --payload '{"Records":[{"s3":{"bucket":{"name":"cloud-media-input-{your-id}"},"object":{"key":"jobs/test-job-id/input_0000.jpg"}}}]}' \
  response.json
cat response.json
```
