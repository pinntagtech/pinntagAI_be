import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

export const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function getS3ObjectStream(Key: string): Promise<Readable> {
  const Bucket = process.env.AWS_S3_BUCKET!;
  const res = await s3.send(new GetObjectCommand({ Bucket, Key }));
  if (!res.Body || !(res.Body instanceof Readable)) {
    // AWS SDK v3 can return a stream-like object; coerce to Readable
    return Readable.from(res.Body as any);
  }
  return res.Body;
}
