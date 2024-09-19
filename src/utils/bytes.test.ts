import { formatBytes, parseBytes } from './bytes';

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

describe('parseBytes', () => {
	it('should return NaN if bytes is invalid', () => {
		expect(parseBytes('')).toBe(NaN);
		expect(parseBytes('1')).toBe(NaN);
		expect(parseBytes('B')).toBe(NaN);
	});

	it('should parse bytes to KiB', () => {
		expect(parseBytes('1 KiB')).toBe(1024);
		expect(parseBytes('2 KiB')).toBe(2048);
	});

	it('should parse bytes to MiB', () => {
		expect(parseBytes('1 MiB')).toBe(1048576);
		expect(parseBytes('1.19 MiB')).toBe(1247805);
		expect(parseBytes('2 MiB')).toBe(2097152);
	});

	it('should parse bytes to GiB', () => {
		expect(parseBytes('1 GiB')).toBe(1073741824);
		expect(parseBytes('2 GiB')).toBe(2147483648);
	});

	it('should parse bytes to TiB', () => {
		expect(parseBytes('1 TiB')).toBe(1099511627776);
		expect(parseBytes('2 TiB')).toBe(2199023255552);
	});

	it('should parse bytes to PiB', () => {
		expect(parseBytes('1 PiB')).toBe(1125899906842624);
		expect(parseBytes('2 PiB')).toBe(2251799813685248);
	});
});
