import { StreamType } from '@/schemas/stream.schema';

export interface CinemetaResponse {
  meta: {
    imdb_id: string;
    name: string;
    type: StreamType;
    // TODO: add the rest of the fields, but for now we don't need them all.
  };
}
