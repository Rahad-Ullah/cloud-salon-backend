import { vi } from 'vitest';

export const s3SendSpy = vi.fn().mockResolvedValue({});

export class MockS3Client {
  send = s3SendSpy;
}

export class MockPutObjectCommand {
  constructor(public args: any) {}
}

export class MockDeleteObjectCommand {
  constructor(public args: any) {}
}

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  PutObjectCommand: MockPutObjectCommand,
  DeleteObjectCommand: MockDeleteObjectCommand,
}));
