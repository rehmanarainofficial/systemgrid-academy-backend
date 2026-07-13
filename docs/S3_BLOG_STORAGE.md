# S3 Blog and Instructor Image Storage

SystemGrid Academy uploads blog cover images and instructor profile photos from the NestJS API only. These images always go to AWS S3, even when `STORAGE_DRIVER=local` is set for other uploads. AWS credentials must never be exposed through the Next.js frontend or committed to Git.

## 1. Rotate exposed credentials

If an access key has been pasted into chat, a ticket, or source code, deactivate and delete it in AWS IAM before deploying. Create a new least-privilege identity or, preferably, attach an IAM role to the API runtime.

## 2. Recommended environment

```env
STORAGE_DRIVER=s3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_PUBLIC_BASE_URL=https://your-cloudfront-domain.example
```

The AWS SDK uses its default Node.js credential provider chain. On EC2/ECS, prefer an IAM role. When the host cannot use a role, inject rotated `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` values through the deployment secret manager.

## 3. Least-privilege writer policy

Attach a policy like this to the API role/user. Replace the bucket ARN and keep access restricted to the `blogs/` and `instructors/` prefixes.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WriteAcademyPublicImages",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/blogs/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME/instructors/*"
      ]
    }
  ]
}
```

## 4. Public delivery

Recommended: keep S3 Block Public Access enabled and serve images through CloudFront with Origin Access Control. Set `AWS_S3_PUBLIC_BASE_URL` to the CloudFront distribution URL.

Direct public S3 delivery is supported by setting `AWS_S3_PUBLIC_BASE_URL` to the bucket's public regional URL, but it requires a carefully scoped public-read bucket policy. CloudFront is preferred for cache control and private bucket access.

## 5. Deploy and migrate

```bash
npm run build
npm run migration:run
```

The API accepts JPG, PNG, and WebP blog and instructor images up to 5 MB. Only authenticated Admin and Super Admin users can upload or publish this content.
