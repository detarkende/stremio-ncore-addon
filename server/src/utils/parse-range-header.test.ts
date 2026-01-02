import { HTTPException } from 'hono/http-exception';
import { parseRangeHeader } from './parse-range-header';

describe('parseRangeHeader', () => {
  it.each([
    { rangeHeader: 'bytes=0-499', fileSize: 1000, expected: { start: 0, end: 499 } },
    { rangeHeader: 'bytes=500-999', fileSize: 1000, expected: { start: 500, end: 999 } },
    { rangeHeader: 'bytes=200-700', fileSize: 1000, expected: { start: 200, end: 700 } },
  ])(
    'should parse valid range headers correctly',
    ({ rangeHeader, fileSize, expected }) => {
      const result = parseRangeHeader(rangeHeader, fileSize);
      expect(result).toEqual(expected);
    },
  );

  it.each([
    { rangeHeader: 'bytes=0-', fileSize: 1000, expected: { start: 0, end: 999 } },
    { rangeHeader: 'bytes=500-', fileSize: 1000, expected: { start: 500, end: 999 } },
    { rangeHeader: 'bytes=-400', fileSize: 1000, expected: { start: 600, end: 999 } },
  ])('should handle open-ended ranges', ({ rangeHeader, fileSize, expected }) => {
    const result = parseRangeHeader(rangeHeader, fileSize);
    expect(result).toEqual(expected);
  });

  it.each([
    { rangeHeader: 'bytes=1000-1500', fileSize: 1000 },
    { rangeHeader: 'bytes=1500-2000', fileSize: 1000 },
    { rangeHeader: 'bytes=2000-', fileSize: 1000 },
    { rangeHeader: 'bytes=-1500', fileSize: 1000 },
  ])(
    'should throw an error for unsatisfiable range headers',
    async ({ rangeHeader, fileSize }) => {
      let error: HTTPException | null = null;
      try {
        parseRangeHeader(rangeHeader, fileSize);
      } catch (e) {
        error = e as HTTPException;
      }
      expect(error).toBeInstanceOf(HTTPException);
      expect(error?.status).toBe(416);
      expect(await error?.res?.text()).toBe('Unsatisfiable range header');
    },
  );
  it.each([
    { rangeHeader: 'blabla', fileSize: 1000 },
    { rangeHeader: 'bytes500-', fileSize: 1000 },
  ])(
    'should throw an error for malformed range headers',
    async ({ rangeHeader, fileSize }) => {
      let error: HTTPException | null = null;
      try {
        parseRangeHeader(rangeHeader, fileSize);
      } catch (e) {
        error = e as HTTPException;
      }
      expect(error).toBeInstanceOf(HTTPException);
      expect(error?.status).toBe(416);
      expect(error?.res).toBeDefined();
      expect(await error?.res?.text()).toBe('Malformed range header');
    },
  );

  it('should default to full range when no range header is provided', () => {
    const result = parseRangeHeader(undefined, 1000);
    expect(result).toEqual({ start: 0, end: 999 });
  });
  it('should handle multiple ranges by returning the first one', () => {
    const result = parseRangeHeader('bytes=0-99,200-299', 1000);
    expect(result).toEqual({ start: 0, end: 99 });
  });
});
