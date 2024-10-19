import { StreamType } from '@/schemas/stream.schema';
import { CinemetaResponse } from './types';

export class CinemetaService {
  private CINEMETA_URL = 'https://v3-cinemeta.strem.io';

  public async getMetadataByImdbId(type: StreamType, imdbId: string): Promise<CinemetaResponse> {
    const response = await fetch(`${this.CINEMETA_URL}/meta/${type}/${imdbId}.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch stream data from Cinemeta');
    }
    return response.json();
  }
}
