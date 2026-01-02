import parseRange from 'range-parser';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from 'src/types/http';

/**
 * Parses the Range header from a request and returns the start and end byte positions.
 * @throws {HTTPException} If the range header is malformed or unsatisfiable.
 */
export const parseRangeHeader = (
  rangeHeader: string | undefined,
  fileSize: number,
): { start: number; end: number } => {
  if (!rangeHeader) {
    rangeHeader = 'bytes=0-';
  }
  const ranges = parseRange(fileSize, rangeHeader);
  if (ranges === -1) {
    throwRangeError('Unsatisfiable range header', fileSize);
  }
  if (ranges === -2) {
    throwRangeError('Malformed range header', fileSize);
  }
  if (ranges.length === 0) {
    throwRangeError('No valid ranges found in range header', fileSize);
  }

  const { start, end } = ranges[0];

  return { start, end };
};

function throwRangeError(message: string, fileSize: number): never {
  const res = new Response(message, {
    status: HttpStatusCode.RANGE_NOT_SATISFIABLE,
    headers: {
      'Content-Range': `bytes */${fileSize}`,
    },
  });
  throw new HTTPException(HttpStatusCode.RANGE_NOT_SATISFIABLE, { res });
}
