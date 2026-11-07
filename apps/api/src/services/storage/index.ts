import { config } from '../../config';
import { IStorageService } from './storage.interface';
import { S3StorageService } from './s3.storage.service';
import { LocalStorageService } from './local.storage.service';

export * from './storage.interface';
export * from './s3.storage.service';
export * from './local.storage.service';

export const storageService: IStorageService =
  config.STORAGE_DRIVER === 's3'
    ? new S3StorageService()
    : new LocalStorageService();
