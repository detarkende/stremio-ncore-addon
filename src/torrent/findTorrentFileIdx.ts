import {
	filenameParse,
	Resolution,
	type ParsedShow,
	parseLanguage,
	parseResolution,
	Language,
} from '@ctrl/video-filename-parser';
import type { NcoreTorrent, ParsedDataFromTorrentFile } from '@/ncore/getTorrents';

export const findTorrentFileIdx = (
	torrent: NcoreTorrent & ParsedDataFromTorrentFile,
	episodeInfo?: { season: number; episode: number },
) => {
	const isMovie = !episodeInfo;
	if (isMovie) {
		const fileSizes = torrent.files.map(({ length }) => length);
		const biggestFileSize = Math.max(...fileSizes);
		const biggestFileIdx = fileSizes.indexOf(biggestFileSize);
		return parseMetadata(torrent, biggestFileIdx);
	}

	const { season, episode } = episodeInfo;
	const filesWithParsedNames = torrent.files.map(
		({ name }) => filenameParse(name, true) as ParsedShow,
	);
	const indexOfFileWithSeasonAndEpisode = filesWithParsedNames.findIndex((info) => {
		return info.seasons?.includes(season) && info.episodeNumbers?.includes(episode);
	});
	return parseMetadata(torrent, indexOfFileWithSeasonAndEpisode);
};

const parseMetadata = (
	torrent: NcoreTorrent & ParsedDataFromTorrentFile,
	fileIdx: number,
): [number, { languages: Language[]; resolution: Resolution }] => {
	const selectedFile = torrent.files[fileIdx];
	const languages = [
		...new Set([
			...parseLanguage(torrent.release_name),
			...(selectedFile ? parseLanguage(selectedFile.name) : []),
			convertCategoryToLanguage(torrent.category),
		]),
	].sort();

	const resolution =
		((selectedFile && parseResolution(selectedFile.name).resolution) ||
			parseResolution(torrent.release_name).resolution) ??
		convertCategoryToResolution(torrent.category);
	return [
		fileIdx,
		{
			languages,
			resolution,
		},
	];
};

const convertCategoryToLanguage = (category: NcoreTorrent['category']): Language => {
	if (category.includes('_hun')) {
		return Language.Hungarian;
	}
	return Language.English;
};
const convertCategoryToResolution = (category: NcoreTorrent['category']): Resolution => {
	if (['xvid', 'xvid_hun', 'xvidser', 'xvidser_hun'].includes(category)) {
		return Resolution.R480P;
	}
	return Resolution.R720P;
};
