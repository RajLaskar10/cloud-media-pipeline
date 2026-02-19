# CloudWatch Setup

## What to Monitor

Two Lambda functions need monitoring: `generate_upload_url` and `process_media`. The processing function is the critical one — it's where failures and performance issues will show up.

---

## Metrics Dashboard

Create a CloudWatch dashboard called `cloud-media-pipeline`.

### Widgets to add:

**1. process_media — Duration**
- Metric: `AWS/Lambda` → `Duration` → function: `process_media`
- Stat: Average + p95
- Why: This tells you how long processing actually takes. Use p95 to catch outliers.

**2. process_media — Errors**
- Metric: `AWS/Lambda` → `Errors` → function: `process_media`
- Stat: Sum
- Why: FFmpeg failures, S3 permission errors, timeout breaches all show here.

**3. process_media — Memory Used vs Allocated**
- Metric: from Lambda logs via Log Insights (see below)
- Why: If max memory used is close to allocated, increase allocation. Lambda gives more CPU with more memory.

**4. generate_upload_url — Invocations + Errors**
- Straightforward API health check.

---

## Alarms

### Alarm 1: Processing Errors
```
Metric: process_media Errors
Threshold: >= 1 in 5 minutes
Action: SNS notification → your email
```
Any FFmpeg failure should alert you immediately.

### Alarm 2: Processing Duration Approaching Timeout
```
Metric: process_media Duration (p95)
Threshold: >= 240000 ms (4 minutes, Lambda timeout is 5 min)
Action: SNS notification
```
If p95 duration approaches your timeout ceiling, you need to investigate before jobs start failing.

### Alarm 3: Lambda Throttles
```
Metric: process_media Throttles
Threshold: >= 1 in 5 minutes
Action: SNS notification
```
Throttles mean Lambda hit your concurrency limit. Default is 1000 concurrent executions per account.

---

## Log Insights Queries

### Average processing duration per job
```
fields @timestamp, @duration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), avg(@maxMemoryUsed) by bin(1h)
```

### Find failed jobs
```
fields @timestamp, @message
| filter @message like /ERROR/ or @message like /FFmpeg failed/
| sort @timestamp desc
| limit 20
```

### Memory utilization check
```
fields @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| stats avg(@maxMemoryUsed / @memorySize * 100) as avg_memory_pct
```
If this is consistently above 80%, increase Lambda memory allocation.

---

## Benchmarks (fill in after building)

Use the Log Insights duration query above after running test jobs. Record results in `/docs/benchmarks.md`. These numbers become your resume bullet point — e.g. "average processing time of X seconds for N-image jobs at 1280x720."
