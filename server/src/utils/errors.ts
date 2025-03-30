import { HttpStatusCode } from '@/types/http';
import { HTTPException } from 'hono/http-exception';

export const throwServerError = (error: unknown, message: string): HTTPException => {
  let cause = undefined;
  if (error instanceof Error) {
    if (error instanceof HTTPException) {
      cause = error.cause;
    } else {
      cause = error;
    }
  }
  console.error(`${message}:`, error);
  return new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
    message: `${message}. Error: ${error}`,
    cause,
  });
};
