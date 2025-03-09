import { Injectable, Req, Res } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  async getPresignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.AWS_S3_BUCKET,
      Key: fileKey, // Example: "uploads/user123/profile.jpg"
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn }); // Expires in 1 hour
  }

  async uploadFile(file) {
    const { originalname } = file;

    return await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      originalname,
      file.mimetype,
    );
  }

  async s3_upload(file, bucket, name, mimetype) {
    console.log('Uploading file to S3.....................');
    console.log(
      'AWS_S3_BUCKET>>>>>>>>>>>>>>>>',
      process.env.AWS_S3_BUCKET_NAME,
    );
    console.log(
      'AWS_S3_ACCESS_KEY>>>>>>>>>>>>>>>>',
      process.env.AWS_S3_ACCESS_KEY,
    );
    console.log(
      'AWS_S3_KEY_SECRET>>>>>>>>>>>>>>>>',
      process.env.AWS_S3_KEY_SECRET,
    );

    const params = {
      Bucket: bucket,
      Key: `${process.env.APP_ENV || ''}/${String(name)}`,
      Body: file,
      // ACL: 'public-read',
      ACL: 'private',
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };

    console.log(params);

    try {
      let s3Response = await this.s3
        .upload({
          Bucket: params.Bucket,
          Key: params.Key,
          Body: params.Body,
          ACL: params.ACL,
          ContentType: params.ContentType,
          ContentDisposition: params.ContentDisposition,
        })
        .promise();
      console.log(s3Response);
      return s3Response;
    } catch (e) {
      console.log(e);
    }
  }
}
