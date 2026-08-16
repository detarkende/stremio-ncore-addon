import fs from 'fs';

import mockFs from 'mock-fs';

import { ensureDirExists, getHighestCommonDir } from './files';

describe('ensureDirExists', () => {
  it('should not create directory if it already exists', () => {
    mockFs({
      '/existing/nested/dir': {},
    });
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');
    ensureDirExists('/existing/nested/dir');
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
    mkdirSyncSpy.mockRestore();
    mockFs.restore();
  });

  it('should create directory if it does not exist', () => {
    mockFs({});
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');
    ensureDirExists('/new/nested/dir');
    expect(mkdirSyncSpy).toHaveBeenCalledWith('/new/nested/dir', { recursive: true });
    mkdirSyncSpy.mockRestore();
    mockFs.restore();
  });
});

describe('getHighestCommonDir', () => {
  it('should return the highest common path prefix', () => {
    const paths = [
      '/user/downloads/MovieTitle/video1.mp4',
      '/user/downloads/MovieTitle/video2.mp4',
      '/user/downloads/MovieTitle/sample/video.mkv',
    ];
    const result = getHighestCommonDir(paths);
    expect(result).toBe('/user/downloads/MovieTitle');
  });

  it('should handle relative paths', () => {
    const paths = [
      'projects/app/src/index.ts',
      'projects/app/src/utils/helpers.ts',
      'projects/app/src/components/Button.tsx',
    ];
    const result = getHighestCommonDir(paths);
    expect(result).toBe('projects/app/src');
  });

  it('should throw an error if there is no common prefix', () => {
    const paths = [
      '/user/downloads/MovieTitle/video1.mp4',
      '/var/media/OtherMovie/video2.mp4',
    ];
    expect(() => getHighestCommonDir(paths)).toThrow('No common directory found');
  });

  it('should return the full path for single path', () => {
    const paths = ['/user/downloads/movie.mp4'];
    const result = getHighestCommonDir(paths);
    expect(result).toBe('/user/downloads/movie.mp4');
  });

  it('should throw an error for empty array', () => {
    const paths: string[] = [];
    expect(() => getHighestCommonDir(paths)).toThrow(
      'No file paths provided, cannot determine highest common directory',
    );
  });
});
