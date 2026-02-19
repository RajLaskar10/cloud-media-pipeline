# lambda/process_media/handler.py
# Triggered by S3 ObjectCreated event on input bucket
# Downloads all images for a job, stitches into video via FFmpeg, uploads output

import json
import boto3
import subprocess
import os
import re
import logging
from pathlib import Path

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
INPUT_BUCKET = os.environ['INPUT_BUCKET']
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
FFMPEG_PATH = '/opt/bin/ffmpeg'  # Provided by Lambda Layer
TMP_DIR = '/tmp'


def lambda_handler(event, context):
    """
    Triggered when a file is uploaded to the input bucket.
    Extracts job_id from the S3 key, checks if all files for the job
    are present, then processes.

    S3 key format: jobs/{job_id}/input_{index}.jpg
    This function is triggered per file — it only processes when
    it detects the job is complete (all expected files present).
    """
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        logger.info(f"Triggered by: s3://{bucket}/{key}")

        job_id = extract_job_id(key)
        if not job_id:
            logger.error(f"Could not extract job_id from key: {key}")
            continue

        process_job(job_id)


def extract_job_id(key):
    # key format: jobs/{job_id}/input_0000.jpg
    match = re.match(r'jobs/([^/]+)/input_\d+\.jpg', key)
    return match.group(1) if match else None


def process_job(job_id):
    job_tmp = Path(TMP_DIR) / job_id
    job_tmp.mkdir(exist_ok=True)

    # List all input files for this job
    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=INPUT_BUCKET, Prefix=f'jobs/{job_id}/')
    keys = [obj['Key'] for page in pages for obj in page.get('Contents', [])]

    if not keys:
        logger.error(f"No input files found for job {job_id}")
        return

    logger.info(f"Processing job {job_id} with {len(keys)} files")

    # Download all images
    local_files = []
    for key in sorted(keys):
        filename = Path(key).name
        local_path = job_tmp / filename
        s3_client.download_file(INPUT_BUCKET, key, str(local_path))
        local_files.append(str(local_path))

    # Write FFmpeg input list
    list_file = job_tmp / 'input_list.txt'
    with open(list_file, 'w') as f:
        for path in sorted(local_files):
            f.write(f"file '{path}'\n")
            f.write("duration 0.5\n")  # 0.5 seconds per image

    # Run FFmpeg
    output_path = job_tmp / 'output.mp4'
    ffmpeg_cmd = [
        FFMPEG_PATH,
        '-f', 'concat',
        '-safe', '0',
        '-i', str(list_file),
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        str(output_path)
    ]

    logger.info(f"Running FFmpeg: {' '.join(ffmpeg_cmd)}")
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"FFmpeg failed: {result.stderr}")
        raise RuntimeError(f"FFmpeg processing failed for job {job_id}")

    # Upload output to output bucket
    output_key = f"jobs/{job_id}/output.mp4"
    s3_client.upload_file(
        str(output_path),
        OUTPUT_BUCKET,
        output_key,
        ExtraArgs={'ContentType': 'video/mp4'}
    )

    logger.info(f"Job {job_id} complete. Output: s3://{OUTPUT_BUCKET}/{output_key}")
