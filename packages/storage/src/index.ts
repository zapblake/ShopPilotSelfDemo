import type { StorageAdapter } from "./interface";
import { LocalStorageAdapter } from "./adapters/local";
import { S3StorageAdapter } from "./adapters/s3";

export type { StorageAdapter } from "./interface";

export function getStorageAdapter(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return new LocalStorageAdapter();
    case "s3":
      return new S3StorageAdapter();
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}
