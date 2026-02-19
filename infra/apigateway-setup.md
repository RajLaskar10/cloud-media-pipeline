# API Gateway Setup

## Create HTTP API (not REST API)

HTTP API is cheaper and has lower latency. REST API has more features but you don't need them here.

### Steps
1. AWS Console → API Gateway → Create API → HTTP API
2. Add integration: Lambda → `generate_upload_url`
3. Route: `POST /upload-url`
4. Stage: `$default` (auto-deploy)

### CORS Configuration
Add CORS in API Gateway settings:
```
Allow origins: http://localhost:5173, https://your-cloudfront-domain.cloudfront.net
Allow methods: POST, OPTIONS
Allow headers: Content-Type
```

### Get Your Endpoint
After creation, API Gateway gives you an endpoint like:
```
https://abc123.execute-api.us-east-1.amazonaws.com/upload-url
```

Set this as `VITE_API_BASE_URL` in your frontend `.env`.

---

## Testing the Endpoint

```bash
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/upload-url \
  -H "Content-Type: application/json" \
  -d '{"file_count": 3}'
```

Expected response:
```json
{
  "job_id": "uuid-here",
  "upload_urls": [
    {"index": 0, "key": "jobs/uuid/input_0000.jpg", "url": "https://...presigned..."},
    {"index": 1, "key": "jobs/uuid/input_0001.jpg", "url": "https://...presigned..."},
    {"index": 2, "key": "jobs/uuid/input_0002.jpg", "url": "https://...presigned..."}
  ]
}
```
