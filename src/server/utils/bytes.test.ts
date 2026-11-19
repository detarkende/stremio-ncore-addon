import { formatBytes } from './bytes';

describe('formatBytes', () => {
  it('should return "0 Bytes" if bytes is 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes to KiB', () => {
    expect(formatBytes(1024)).toBe('1 KiB');
    expect(formatBytes(2048)).toBe('2 KiB');
  });

  it('should format bytes to MiB', () => {
    expect(formatBytes(1048576)).toBe('1 MiB');
    expect(formatBytes(1248576)).toBe('1.19 MiB');
    expect(formatBytes(1247805)).toBe('1.19 MiB');
    expect(formatBytes(2097152)).toBe('2 MiB');
  });

  it('should format bytes to GiB', () => {
    expect(formatBytes(1073741824)).toBe('1 GiB');
    expect(formatBytes(2147483648)).toBe('2 GiB');
  });

  it('should format bytes to TiB', () => {
    expect(formatBytes(1099511627776)).toBe('1 TiB');
    expect(formatBytes(2199023255552)).toBe('2 TiB');
  });

  it('should format bytes to PiB', () => {
    expect(formatBytes(1125899906842624)).toBe('1 PiB');
    expect(formatBytes(2251799813685248)).toBe('2 PiB');
  });
});
