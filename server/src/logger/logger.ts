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
    ],
  }),
);

export const logLevels = [
  'error',
  'warn',
  'info',
  'debug',
] as const satisfies readonly (keyof typeof logger)[];
