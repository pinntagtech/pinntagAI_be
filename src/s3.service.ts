import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly bucket = process.env.B2_BUCKET_NAME!;
  private readonly cdnDomain = process.env.CDN_DOMAIN!;
  private readonly envPrefix = process.env.APP_ENV || 'dev';
  private readonly logger = new Logger(S3Service.name);

  private readonly s3Client = new S3Client({
    region: process.env.B2_REGION,
    endpoint: process.env.B2_ENDPOINT, // e.g. https://s3.us-east-005.backblazeb2.com
    forcePathStyle: true,               // required for Backblaze B2
    credentials: {
      accessKeyId: process.env.B2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
    },
  });

  /**
   * ----------------------------
   * Modern Upload (preferred)
   * ----------------------------
   */
  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    try {
      const timestamp = Date.now();
      const key = `${this.envPrefix}/${timestamp}-${file.originalname}`.replace(/^\/+/, '');

      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
        CacheControl: 'public, max-age=31536000',
        ACL: 'private',
      });

      await this.s3Client.send(putCommand);

      const url = `https://${this.cdnDomain}/${key}`;
      this.logger.log(`✅ Uploaded: ${key}`);
      return { key, url };
    } catch (error) {
      this.logger.error(`❌ Upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  /**
   * ----------------------------
   * Modern Delete (preferred)
   * ----------------------------
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
      await this.s3Client.send(command);
      this.logger.log(`✅ Deleted: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Failed to delete ${key}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  /**
   * ----------------------------
   * Equivalent to your s3_upload()
   * ----------------------------
   * Uploads a file buffer to B2 using the AWS SDK v3
   */
  async s3_upload(file: Buffer, bucket: string, name: string, mimetype: string) {
    const key = `${process.env.APP_ENV || ''}/${String(name)}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      // ACL: ObjectCannedACL.private,
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };

    this.logger.log(`Uploading file to B2: ${key}`);

    try {
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Construct Cloudflare URL
      const url = `https://${this.cdnDomain}/${key}`;
      this.logger.log(`✅ Uploaded to B2: ${url}`);

      return {
        Bucket: bucket,
        Key: key,
        Location: url,
      };
    } catch (e) {
      this.logger.error(`❌ Failed to upload ${key}: ${e.message}`);
      throw new InternalServerErrorException('Upload to B2 failed');
    }
  }

  /**
   * ----------------------------
   * Equivalent to your s3_delete()
   * ----------------------------
   * Deletes an object from B2
   */
  async s3_delete(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`✅ Deleted: ${key}`);
    } catch (err) {
      this.logger.error(`❌ Failed to delete ${key}: ${err.message}`);
      throw new InternalServerErrorException('Delete from B2 failed');
    }
  }

  /**
   * Optional: Generate presigned URL for temporary access
   */
  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      this.logger.error(`❌ Failed to generate presigned URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }
}
