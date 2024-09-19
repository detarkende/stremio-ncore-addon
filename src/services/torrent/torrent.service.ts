import parseTorrent from 'parse-torrent';
import type { ParsedShow } from '@ctrl/video-filename-parser';
import { filenameParse, parseResolution, Resolution } from '@ctrl/video-filename-parser';
import contentDisposition from 'content-disposition';
import type { NcoreTorrent } from '../ncore';
import { config } from '../config';
import type { ParsedTorrentDetails } from './types';
import type { StreamQuery } from '@/schemas/stream.schema';
import { writeFileWithCreateDir } from '@/utils/files';

export const downloadAndParseTorrent = async (
	torrentUrl: string,
): Promise<ParsedTorrentDetails> => {
	const torrentResponse = await fetch(torrentUrl);
	const buffer = await torrentResponse.arrayBuffer();
	const torrentData = await parseTorrent(new Uint8Array(buffer));
	return {
		infoHash: torrentData.infoHash,
		files:
			torrentData.files?.map((file) => ({
				name: file.name,
				length: file.length,
				offset: file.offset,
				path: file.path,
			})) ?? [],
	};
};

/**
 * @returns the path to the downloaded torrent file
 */
export const downloadTorrentFile = async (torrentUrl: string): Promise<string> => {
	const torrentReq = await fetch(torrentUrl);
	const torrentArrayBuffer = await torrentReq.arrayBuffer();
	const parsedTorrent = await parseTorrent(new Uint8Array(torrentArrayBuffer));
	// torrent file name without the .torrent extension
	const torrentFileName = contentDisposition
		.parse(torrentReq.headers.get('content-disposition') ?? '')
		.parameters.filename?.replace(/\.torrent$/i, '');

	const torrentFilePath = `${config.TORRENTS_DIR}/${torrentFileName}-${parsedTorrent.infoHash}.torrent`;

	writeFileWithCreateDir(torrentFilePath, Buffer.from(torrentArrayBuffer));
	return torrentFilePath;
};

export const getMediaFileIndex = (
	torrent: ParsedTorrentDetails,
	{ season, episode }: Pick<StreamQuery, 'season' | 'episode'>,
): number => {
	const fileSizes = torrent.files.map((file) => file.length);
	const biggestFileSize = Math.max(...fileSizes);
	const biggestFileIndex = fileSizes.indexOf(biggestFileSize);

	if (!season || !episode) {
		return biggestFileIndex;
	}

	const parsedFileNames = torrent.files.map(
		(file) => filenameParse(file.name, true) as ParsedShow,
	);
	const searchedEpisode = parsedFileNames.find((info) => {
		return info.seasons?.includes(season) && info.episodeNumbers?.includes(episode);
	});
	return searchedEpisode ? parsedFileNames.indexOf(searchedEpisode) : -1;
};

export const getResolution = (torrent: NcoreTorrent, fileName: string): Resolution => {
	const resolution = parseResolution(fileName).resolution;
	if (resolution) {
		return resolution;
	}
	if (['xvid', 'xvid_hun', 'xvidser', 'xvidser_hun'].includes(torrent.category)) {
		return Resolution.R480P;
	}
	return Resolution.R720P;
};
