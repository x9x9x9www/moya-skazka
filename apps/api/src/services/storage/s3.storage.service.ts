import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './storage.interface';
import { config } from '../../config';

export class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = config.S3_BUCKET_NAME;
    this.client = new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION || 'ru-central1',
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
    });
  }

  public async uploadBuffer(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType = 'image/webp'
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
    });

    await this.client.send(command);
    return cleanKey;
  }

  public async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = config.S3_SIGNED_URL_EXPIRES_SECONDS
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  public async deleteObject(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    await this.client.send(command);
  }

  public async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}
