import { ReactNode } from 'react';
import { toast } from 'sonner';
import { z, ZodError } from 'zod';

export class HttpError extends Error {
  response: Response;
  constructor(response: Response) {
    super(response.statusText);
    this.response = response;
  }
}

const isJSON = (value: string) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const isZodError = (value: unknown): value is { error: ZodError } => {
  return z
    .object({
      success: z.literal(false),
      error: z.object({
        name: z.literal('ZodError'),
        issues: z.array(z.object({ message: z.string() })),
      }),
    })
    .safeParse(value).success;
};

export const handleError = async (error: Error, title = 'Something went wrong') => {
  if (error instanceof HttpError) {
    let message: ReactNode = `Status code: ${error.response.status}`;
    const responseBody = await error.response.text();
    if (responseBody && isJSON(responseBody)) {
      const body = JSON.parse(responseBody);
      if (isZodError(body)) {
        message = (
          <ul className="list-disc list-inside">
            {body.error.issues.map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
        );
      } else if ('message' in body) {
        message = body.message;
      }
    }
    toast.error(title, {
      description: message,
    });
  } else {
    toast.error(title, {
      description: error.message ?? 'Unknown error',
    });
  }
};
