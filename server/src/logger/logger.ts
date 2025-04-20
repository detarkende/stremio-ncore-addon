import { resolve } from 'path';
import pino from 'pino';

export const logger = pino(
  {
    serializers: {
      error: pino.stdSerializers.err,
      errors: pino.stdSerializers.err,
    },
  },
  pino.transport({
    targets: [
      {
        target: 'pino/file',
        options: { destination: 1 },
      },

      ...(process.env.NODE_ENV === 'test'
        ? []
        : [
            {
              target: 'pino-roll',
              options: {
                file: resolve(process.env.ADDON_DIR as string, 'logs', 'sna-log'),
                mkdir: true,
                dateFormat: 'yyyy-MM-dd',
                frequency: 'daily',
                extension: 'log',
                limit: {
                  count: 30,
                },
              },
            },
          ]),
    ],
  }),
);
