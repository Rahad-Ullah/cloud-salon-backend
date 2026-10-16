import { describe, expect, it, vi } from 'vitest';
import s3Client from '../config/aws-s3';
import deleteS3File from './deleteS3File';

describe('deleteS3File Shared Utility', () => {
  const s3SendSpy = vi.spyOn(s3Client, 'send').mockResolvedValue({} as any);
  it('should extract s3 key from full URL and invoke s3Client.send', async () => {
    s3SendSpy.mockClear();

    const fullUrl = 'https://media.cloudsalon.com/image/salon-cover-1234.png';
    await deleteS3File(fullUrl);

    expect(s3SendSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle relative s3 key directly without errors', async () => {
    s3SendSpy.mockClear();

    await deleteS3File('image/direct-key.png');
    expect(s3SendSpy).toHaveBeenCalledTimes(1);
  });

  it('should do nothing gracefully if file identifier is empty', async () => {
    s3SendSpy.mockClear();

    await deleteS3File('');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });
});
