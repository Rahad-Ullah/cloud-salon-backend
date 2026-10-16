import { describe, expect, it } from 'vitest';
import { getSingleFilePath, getMultipleFilesPath } from './getFilePath';

describe('getFilePath Shared Utility', () => {
  it('should extract single file path or location', () => {
    const filesWithLocation = {
      image: [{ location: 'https://cdn.cloudsalon.com/img1.png' }],
    };
    expect(getSingleFilePath(filesWithLocation, 'image')).toBe(
      'https://cdn.cloudsalon.com/img1.png',
    );

    const filesWithPath = {
      doc: [{ path: '/uploads/contract.pdf' }],
    };
    expect(getSingleFilePath(filesWithPath, 'doc')).toBe('/uploads/contract.pdf');
  });

  it('should return undefined if files object or folder is empty/missing', () => {
    expect(getSingleFilePath(null, 'image')).toBeUndefined();
    expect(getSingleFilePath({}, 'image')).toBeUndefined();
    expect(getSingleFilePath({ image: [] }, 'image')).toBeUndefined();
  });

  it('should extract array of file paths using getMultipleFilesPath', () => {
    const files = {
      image: [
        { location: 'https://cdn.cloudsalon.com/img1.png' },
        { location: 'https://cdn.cloudsalon.com/img2.png' },
      ],
    };

    const paths = getMultipleFilesPath(files, 'image');
    expect(paths).toEqual([
      'https://cdn.cloudsalon.com/img1.png',
      'https://cdn.cloudsalon.com/img2.png',
    ]);
  });
});
