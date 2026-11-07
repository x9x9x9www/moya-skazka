import fs from 'fs';
import path from 'path';
import { IStorageService } from './storage.interface';
import { config } from '../../config';

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async uploadBuffer(
    key: string,
    buffer: Buffer | Uint8Array,
    _contentType = 'image/webp'
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const targetPath = path.resolve(this.baseDir, cleanKey);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, buffer);
    return cleanKey;
  }

  public async getSignedDownloadUrl(
    key: string,
    _expiresInSeconds = config.S3_SIGNED_URL_EXPIRES_SECONDS
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const baseUrl = config.API_URL.replace(/\/+$/, '');
    return `${baseUrl}/api/v1/media/stream?key=${encodeURIComponent(cleanKey)}`;
  }

  public async deleteObject(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, '');
    const targetPath = path.resolve(this.baseDir, cleanKey);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath).catch(() => {});
    }
  }

  public async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    const targetPath = path.resolve(this.baseDir, cleanKey);
    return fs.existsSync(targetPath);
  }

  public getFilePath(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return path.resolve(this.baseDir, cleanKey);
  }
}
