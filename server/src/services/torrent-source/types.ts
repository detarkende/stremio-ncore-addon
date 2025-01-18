import type { ParsedShow } from '@ctrl/video-filename-parser';
import { filenameParse, parseResolution } from '@ctrl/video-filename-parser';
import type { Resolution, Language } from '@/db/schema/users';
import type { StreamQuery } from '@/schemas/stream.schema';

export interface TorrentFileDetails {
  name: string;
  path: string;
  length: number;
  offset: number;
}

export interface ParsedTorrentDetails {
  infoHash: string;
  files: TorrentFileDetails[];
}

export abstract class TorrentDetails implements ParsedTorrentDetails {
  abstract infoHash: string;
  abstract files: TorrentFileDetails[];
  abstract sourceName: string;
  /**
   * An identifier that can be used to fetch the details of the torrent.
   * Example: ncore's ncore_id.
   */
  abstract sourceId: string;
  /**
   * The resolution that should be used if the real resolution can't be inferred from the files.
   * This can often be inferred from the category of the torrent.
   * Example: ncore's `hd_hun` or `hd_eng` categories can be mapped to `Resolution.R720P`.
   */
  abstract fallbackResolution: Resolution;
  /** If true, then this torrent might not belong to the searched movie/show. */
  abstract isSpeculated?: boolean;
  /**
   * Produces a string that will be used in the description of the stream.
   * ```ts
   * // Example:
   * torrent.displayResolution(Resolution.R720P); // "HD_HUN (720P)"
   * ```
   */
  abstract displayResolution(resolution: Resolution): string;
  abstract getLanguage(): Language;
  /**
   * Returns the name of the torrent. Usually the release name of the torrent.
   */
  abstract getName(): string;

  public getMediaFileIndex({
    season,
    episode,
  }: Pick<StreamQuery, 'season' | 'episode'>): number {
    const fileSizes = this.files.map((file) => file.length);
    const biggestFileSize = Math.max(...fileSizes);
    const biggestFileIndex = fileSizes.indexOf(biggestFileSize);

    if (!season || !episode) {
      return biggestFileIndex;
    }

    const parsedFileNames = this.files.map(
      (file) => filenameParse(file.name, true) as ParsedShow,
    );
    const searchedEpisode = parsedFileNames.find((info) => {
      return info.seasons?.includes(season) && info.episodeNumbers?.includes(episode);
    });
    return searchedEpisode ? parsedFileNames.indexOf(searchedEpisode) : -1;
  }

  public getFile({
    season,
    episode,
  }: Pick<StreamQuery, 'season' | 'episode'>): TorrentFileDetails {
    const fileIndex = this.getMediaFileIndex({ season, episode });
    return this.files[fileIndex] as TorrentFileDetails;
  }

  public getResolution(fileName: string): Resolution {
    const resolution = parseResolution(fileName).resolution;
    return resolution ?? this.fallbackResolution;
  }
}

export interface TorrentSource {
  name: string;
  displayName: string;
  getTorrentsForImdbId: (
    params: Pick<StreamQuery, 'imdbId' | 'type' | 'episode' | 'season'>,
  ) => Promise<TorrentDetails[]>;
  getTorrentUrlBySourceId: (sourceId: string) => Promise<string | null>;
  getRemovableInfoHashes: () => Promise<string[]>;
  getConfigIssues: () => Promise<string | null>;
}

export interface TorrentSourceIssue {
  id: string;
  sourceName: string;
  message: string;
}
