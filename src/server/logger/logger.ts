import {
  configure,
  getConsoleSink,
  getLogger,
  getLogLevels,
  jsonLinesFormatter,
} from '@logtape/logtape';
import { getPrettyFormatter } from '@logtape/pretty';

const isDev = process.env.NODE_ENV === 'development';

await configure({
  sinks: {
    console: getConsoleSink({
      formatter: isDev
        ? getPrettyFormatter({ timestamp: 'date-time', properties: true })
        : jsonLinesFormatter,
    }),
  },
  loggers: [
    { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'error' },
    { category: 'sna.server', sinks: ['console'], lowestLevel: isDev ? 'debug' : 'info' },
    {
      category: 'sna.request',
      sinks: ['console'],
      lowestLevel: isDev ? 'debug' : 'info',
    },
  ],
});

export const logger = getLogger(['sna.server']);
export const requestLogger = getLogger(['sna.request']);

export const logLevels = getLogLevels();
