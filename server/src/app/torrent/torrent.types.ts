import type { ParsedShow } from '@ctrl/video-filename-parser';
import { filenameParse, parseResolution } from '@ctrl/video-filename-parser';
import type { Resolution, Language } from 'src/db/schema/users';
import { StreamType } from 'src/app/stream/stream.constants';
import { isSupportedMedia } from 'src/utils/media-file-extensions';

export interface TorrentFileDetails {
  name: string;
  path: string;
  length: number;
  offset: number;
}

export interface TorrentFileDetails {
  name: string;
  path: string;
  length: number;
  offset: number;
}

export interface ParsedTorrentDetails {
  infoHash: string;
  name: string;
  files: TorrentFileDetails[];
}

export abstract class TorrentDetails implements ParsedTorrentDetails {
  abstract name: string;
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
   * @example
   * ```ts
   * torrent.displayResolution(Resolution.R720P); // "HD_HUN (720P)"
   * ```
   */
  abstract displayResolution(resolution: Resolution): string;
  abstract getLanguage(): Language;
  abstract getSeeders(): number;
  abstract getName(): string;

  public getSearchedFile({
    type,
    season,
    episode,
  }: {
    type: StreamType;
    season: string;
    episode: string;
  }): TorrentFileDetails | null {
    const fileSizes = this.files.map((file) => file.length);
    const biggestFileSize = Math.max(...fileSizes);
    const biggestFileIndex = fileSizes.indexOf(biggestFileSize);

    if (type === StreamType.MOVIE || !season || !episode) {
      return this.files[biggestFileIndex];
    }

    const parsedFileNames = this.files.map((file) => ({
      file,
      parsed: filenameParse(file.name, true) as ParsedShow,
    }));
    const searchedEpisodeIndex = parsedFileNames.findIndex(({ file, parsed }) => {
      return (
        isSupportedMedia(file.path) &&
        !file.path.toLocaleLowerCase().includes('sample') &&
        parsed.seasons?.includes(parseInt(season)) &&
        (parsed.episodeNumbers?.includes(parseInt(episode)) || parsed.fullSeason)
      );
    });
    return this.files[searchedEpisodeIndex] ?? null;
  }

  public getFileResolution(fileName: string): Resolution {
    const resolution = parseResolution(fileName).resolution;
    return resolution ?? this.fallbackResolution;
  }
}

export interface TorrentFile {
  name: string;
  path: string;
  size: number;
  progress: number;
  getStream(range: { start: number; end: number }): ReadableStream;
}

export interface Torrent {
  infoHash: string;
  name: string;
  progress: number;
  size: number;
  downloaded: number;
  path: string;
  files: TorrentFile[];
}
