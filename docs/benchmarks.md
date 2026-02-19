# Performance Benchmarks

## Instructions

Run these test cases after deployment. Use CloudWatch Log Insights queries from `/docs/cloudwatch-setup.md` to extract duration and memory data. Fill in the table below — these numbers go on your resume.

## Test Cases

| Job Size | Images | Resolution | Lambda Memory | Avg Duration | p95 Duration | Max Memory Used |
|---|---|---|---|---|---|---|
| Small | 10 | 1280x720 | 1024MB | TBD | TBD | TBD |
| Medium | 30 | 1280x720 | 1024MB | TBD | TBD | TBD |
| Large | 60 | 1280x720 | 1024MB | TBD | TBD | TBD |
| Large (more memory) | 60 | 1280x720 | 3008MB | TBD | TBD | TBD |

## What to Look For

- Does duration scale linearly with image count? It should.
- Does increasing Lambda memory (and therefore CPU) reduce duration? If so, quantify it — that's your "X% processing time reduction" bullet.
- Is max memory used well below allocated? If so, you may be over-allocating.

## Resume Bullet Template

Once filled in:
> "Benchmarked Lambda processing performance across job sizes using CloudWatch metrics; increasing memory allocation from 1024MB to 3008MB reduced average processing time by X% for 60-image jobs"
