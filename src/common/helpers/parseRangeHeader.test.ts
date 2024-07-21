import { parseRangeHeader } from './parseRangeHeader';

describe('parseRangeHeader', () => {
	it('should return null if rangeHeader is undefined', () => {
		expect(parseRangeHeader(undefined, 100)).toBe(null);
	});

	it('should return null if rangeHeader is empty', () => {
		expect(parseRangeHeader('', 100)).toBe(null);
	});

	it('should return null if rangeHeader is not a valid range header', () => {
		expect(parseRangeHeader('invalid', 100)).toBe(null);
	});

	it('should convert empty start to (filesize - end)', () => {
		expect(parseRangeHeader('bytes=-50', 100)).toEqual({ start: 50, end: 99 });
	});

	it('should convert empty start to (filesize - maxChunkSize)', () => {
		expect(parseRangeHeader('bytes=-50', 100, 10)).toEqual({ start: 90, end: 99 });
	});

	it('should convert empty end to (fileSize - 1)', () => {
		expect(parseRangeHeader('bytes=50-', 100)).toEqual({ start: 50, end: 99 });
	});

	it('should convert empty end to (start + maxChunkSize)', () => {
		expect(parseRangeHeader('bytes=50-', 100, 10)).toEqual({ start: 50, end: 59 });
	});

	it('should return null if start is greater than or equal to fileSize', () => {
		expect(parseRangeHeader('bytes=100-', 100)).toBe(null);
	});

	it('should return null if end is less than or equal to start', () => {
		expect(parseRangeHeader('bytes=50-50', 100)).toBe(null);
		expect(parseRangeHeader('bytes=50-40', 100)).toBe(null);
	});

	it('should truncate end to start + maxChunkSize', () => {
		expect(parseRangeHeader('bytes=50-80', 100, 10)).toEqual({ start: 50, end: 59 });
	});

	it('should truncate end to fileSize - 1 if end is greater than fileSize', () => {
		expect(parseRangeHeader('bytes=50-150', 100)).toEqual({ start: 50, end: 99 });
	});
});
