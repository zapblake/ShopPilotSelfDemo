import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageAdapter } from "../interface";

const BASE_DIR = "/tmp/zapsight-storage";

export class LocalStorageAdapter implements StorageAdapter {
  async upload(key: string, buffer: Buffer, _contentType: string): Promise<void> {
    const filePath = join(BASE_DIR, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(BASE_DIR, key);
    return readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(BASE_DIR, key);
    await unlink(filePath);
  }

  getUrl(key: string): string {
    return `file://${join(BASE_DIR, key)}`;
  }
}
