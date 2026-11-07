export interface IStorageService {
  uploadBuffer(key: string, buffer: Buffer | Uint8Array, contentType?: string): Promise<string>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
