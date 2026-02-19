# lambda/generate_upload_url/handler.py
# Generates a pre-signed S3 URL for direct browser-to-S3 upload
# Triggered via API Gateway POST /upload-url

import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])
INPUT_BUCKET = os.environ['INPUT_BUCKET']
URL_EXPIRY_SECONDS = 300  # 5 minutes


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        file_count = body.get('file_count', 1)
        job_id = str(uuid.uuid4())

        # Generate one pre-signed URL per image file
        upload_urls = []
        for i in range(file_count):
            object_key = f"jobs/{job_id}/input_{i:04d}.jpg"
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': INPUT_BUCKET,
                    'Key': object_key,
                    'ContentType': 'image/jpeg'
                },
                ExpiresIn=URL_EXPIRY_SECONDS
            )
            upload_urls.append({
                'index': i,
                'key': object_key,
                'url': presigned_url
            })

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'job_id': job_id,
                'upload_urls': upload_urls
            })
        }

    except ClientError as e:
        print(f"S3 error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Failed to generate upload URLs'})
        }


def cors_headers():
    return {
        'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
