const clamp = (value: number, { min, max }: { min: number; max: number }) => {
  return Math.min(Math.max(value, min), max);
};

const BYTES_RANGE_REGEX = new RegExp(/bytes=(?<start>\d+)?-(?<end>\d+)?/);

export const parseRangeHeader = (
  rangeHeader: string | undefined,
  fileSize: number,
  maxChunkSize?: number,
): { start: number; end: number } | null => {
  if (!rangeHeader || !BYTES_RANGE_REGEX.test(rangeHeader)) return null;
  const groups = BYTES_RANGE_REGEX.exec(rangeHeader)?.groups ?? {
    start: '',
    end: '',
  };
  const startString = groups.start ?? '';
  const endString = groups.end ?? '';

  if (!startString && !endString) return null;
  if (Number.isNaN(Number(startString)) || Number.isNaN(Number(endString))) return null;

  const start = Number(startString);
  const end = endString === '' ? fileSize : Number(endString);

  const rangeSize = clamp(end - start, {
    min: 0,
    max: Math.min(maxChunkSize ?? fileSize, fileSize),
  });
  if (rangeSize === 0) return null;

  if (!startString) {
    return { start: fileSize - rangeSize, end: fileSize - 1 };
  }

  return { start, end: Math.min(start + rangeSize - 1, fileSize - 1) };
};
