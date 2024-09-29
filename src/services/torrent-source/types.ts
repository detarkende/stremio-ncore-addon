import type { Language } from '@/schemas/language.schema';
import type { Resolution } from '@/schemas/resolution.schema';
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

export interface TorrentDetails extends ParsedTorrentDetails {
	/**
	 * An identifier that can be used to fetch the details of the torrent.
	 * Example: ncore's ncore_id.
	 */
	sourceId: string;
	/**
	 * The resolution that should be used if the real resolution can't be inferred from the files.
	 * This can often be inferred from the category of the torrent.
	 * Example: ncore's `hd_hun` or `hd_eng` categories can be mapped to `Resolution.R720P`.
	 */
	fallbackResolution: Resolution;
	/**
	 * Produces a string that will be used in the description of the stream.
	 * ```ts
	 * // Example:
	 * torrent.displayResolution(Resolution.R720P); // "HD_HUN (720P)"
	 * ```
	 */
	displayResolution: (resolution: Resolution) => string;
	getLanguage: () => Language;
	/**
	 * Returns the name of the torrent. Usually the release name of the torrent.
	 */
	getName: () => string;
}

export interface TorrentSource {
	getTorrentsForImdbId: (
		params: Pick<StreamQuery, 'imdbId' | 'type'>,
	) => Promise<TorrentDetails[]>;
	getTorrentUrlBySourceId: (sourceId: string) => Promise<string>;
	getRemovableInfoHashes: () => Promise<string[]>;
}
