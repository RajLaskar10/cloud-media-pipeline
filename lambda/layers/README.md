# FFmpeg Lambda Layer

Lambda doesn't include FFmpeg by default. You need to attach it as a Layer.

## Option 1: Use a Public Layer (Fastest)

There are community-maintained FFmpeg Lambda layers you can use directly. Search the AWS Serverless Application Repository for "ffmpeg-lambda-layer" or use:

```
arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:1
```

Note: verify this ARN is current and in your region before using it.

## Option 2: Build Your Own Layer (Recommended for production)

```bash
# On an Amazon Linux 2 EC2 instance or via Docker:
docker run --rm -v $(pwd):/out amazonlinux:2 bash -c "
  yum install -y ffmpeg &&
  mkdir -p /tmp/ffmpeg/bin &&
  cp /usr/bin/ffmpeg /tmp/ffmpeg/bin/ &&
  cd /tmp &&
  zip -r /out/ffmpeg-layer.zip ffmpeg/
"
```

Then upload `ffmpeg-layer.zip` as a Lambda Layer:
```bash
aws lambda publish-layer-version \
  --layer-name ffmpeg \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11
```

## Attaching to Lambda

In the Lambda console → your function → Layers → Add a layer → specify ARN or select from list.

The layer mounts at `/opt/` — FFmpeg binary will be at `/opt/bin/ffmpeg`, which matches the `FFMPEG_PATH` variable in `process_media/handler.py`.

## Verify

After attaching, test with a simple Lambda invocation:
```python
import subprocess
result = subprocess.run(['/opt/bin/ffmpeg', '-version'], capture_output=True, text=True)
print(result.stdout)
```
