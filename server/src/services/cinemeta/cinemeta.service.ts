import { StreamType } from '@/schemas/stream.schema';
import { CinemetaResponse } from './types';
import { env } from '@/env';
import { throwServerError } from '@/utils/errors';

export class CinemetaService {
  public async getMetadataByImdbId(
    type: StreamType,
    imdbId: string,
  ): Promise<CinemetaResponse> {
    try {
      const cinemetaUrl = `${env.CINEMETA_URL}/meta/${type}/${imdbId}.json`;
      const response = await fetch(cinemetaUrl);
      if (!response.ok) {
        console.error(
          `Failed to fetch metadata from Cinemeta at URL: ${cinemetaUrl}`,
          response.statusText,
          await response.text(),
        );
        throw new Error('Failed to fetch stream data from Cinemeta');
      }
      return response.json();
    } catch (error) {
      throw throwServerError(error, 'Error fetching metadata from Cinemeta');
    }
  }
}
