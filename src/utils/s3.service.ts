import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

export class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION;
    this.bucketName = process.env.AWS_BUCKET_NAME;

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload_file(file: Express.Multer.File): Promise<{ Key: string }> {
    const key = `image/${uuid()}_${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);
    return { Key: key };
  }

  async deleteFileByKey(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3.send(command);
  }

  async deleteFileByUrl(url: string): Promise<void> {
    const fileKey = this.get_path_from_url(url);
    if (!fileKey) {
      throw new Error('Invalid S3 URL');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    await this.s3.send(command);
  }

  get_path_from_url(url: string): string | null {
    const regex = new RegExp(
      `https://${this.bucketName}.s3.${this.region}.amazonaws.com/(.*)`,
    );
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async get_image_url(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: 604800,
    });

    return url;
  }

  async get_image_urls(keys: string[]): Promise<string[]> {
    return Promise.all(keys.map((key) => this.get_image_url(key)));
  }
}
