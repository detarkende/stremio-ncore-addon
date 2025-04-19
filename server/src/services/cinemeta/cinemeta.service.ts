import type { CinemetaResponse } from './types';
import type { StreamType } from '@/schemas/stream.schema';
import { env } from '@/env';
import { throwServerError } from '@/utils/errors';
import { logger } from '@/logger';

export class CinemetaService {
  public async getMetadataByImdbId(
    type: StreamType,
    imdbId: string,
  ): Promise<CinemetaResponse> {
    try {
      const cinemetaUrl = `${env.CINEMETA_URL}/meta/${type}/${imdbId}.json`;
      const response = await fetch(cinemetaUrl);
      if (!response.ok) {
        logger.error(
          {
            status: response.status,
          },
          `Failed to fetch metadata from Cinemeta at URL: ${cinemetaUrl}`,
        );
        throw new Error('Failed to fetch stream data from Cinemeta');
      }
      return response.json();
    } catch (error) {
      throw throwServerError(error, 'Error fetching metadata from Cinemeta');
    }
  }
}
