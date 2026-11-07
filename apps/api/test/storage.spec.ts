import { describe, it, expect, afterAll } from 'vitest';
import { LocalStorageService } from '../src/services/storage/local.storage.service';
import fs from 'fs';

describe('LocalStorageService Unit Tests', () => {
  const service = new LocalStorageService();
  const testKey = 'test-artifacts/sample.txt';
  const testData = Buffer.from('Привет, Моя Сказка!');

  it('uploads buffer to local storage directory', async () => {
    const key = await service.uploadBuffer(testKey, testData, 'text/plain');
    expect(key).toBe(testKey);
    const exists = await service.exists(testKey);
    expect(exists).toBe(true);
  });

  it('generates a signed download URL linking to stream endpoint', async () => {
    const url = await service.getSignedDownloadUrl(testKey);
    expect(url).toContain('/api/v1/media/stream?key=test-artifacts%2Fsample.txt');
  });

  it('deletes object from storage', async () => {
    await service.deleteObject(testKey);
    const exists = await service.exists(testKey);
    expect(exists).toBe(false);
  });

  afterAll(async () => {
    await service.deleteObject(testKey);
  });
});
