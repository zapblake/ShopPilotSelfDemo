import type { StorageAdapter } from "../interface";

export class S3StorageAdapter implements StorageAdapter {
  async upload(_key: string, _buffer: Buffer, _contentType: string): Promise<void> {
    // TODO: Implement S3 upload using @aws-sdk/client-s3
    throw new Error("S3StorageAdapter not implemented");
  }

  async download(_key: string): Promise<Buffer> {
    // TODO: Implement S3 download using @aws-sdk/client-s3
    throw new Error("S3StorageAdapter not implemented");
  }

  async delete(_key: string): Promise<void> {
    // TODO: Implement S3 delete using @aws-sdk/client-s3
    throw new Error("S3StorageAdapter not implemented");
  }

  getUrl(_key: string): string {
    // TODO: Implement S3 URL generation
    throw new Error("S3StorageAdapter not implemented");
  }
}
