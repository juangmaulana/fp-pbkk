import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const endpoint = process.env.S3_ENDPOINT;
    this.bucket = process.env.S3_BUCKET_NAME || 'default-bucket';

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-access-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key',
      },
      forcePathStyle: true,
    });
  }

  async generatePresignedUrl(
    fileExtension: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; imagePath: string }> {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'test-access-key';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key';
    const bucketName = process.env.S3_BUCKET_NAME || 'default-bucket';

    const s3 = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `posts/${timestamp}-${randomString}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    return { uploadUrl, imagePath: key };
  }
}
