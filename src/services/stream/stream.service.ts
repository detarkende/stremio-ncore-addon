import type { Stream } from 'stremio-addon-sdk';
import { config } from '../config';
import type { FullTorrent } from './types';
import { HUNGARIAN_CATEGORIES, languageEmojiMap } from './constants';
import * as NcoreService from '@/services/ncore';
import { Language } from '@/schemas/language.schema';
import type { User } from '@/schemas/user.schema';
import { rateList } from '@/utils/rate-list';
import { formatBytes } from '@/utils/bytes';

export const convertTorrentToStream = ({
	torrent,
	isRecommended,
	jwt,
}: {
	torrent: FullTorrent;
	isRecommended: boolean;
	jwt: string;
}): Stream => {
	const torrentId = encodeURIComponent(torrent.torrent_id);
	const infoHash = encodeURIComponent(torrent.infoHash);
	const fileIndex = encodeURIComponent(torrent.fileIndex);

	return {
		url: `${config.ADDON_URL}/auth/${jwt}/stream/play/${torrentId}/${infoHash}/${fileIndex}`,
		title: getStreamDescription(torrent, isRecommended),
		behaviorHints: {
			notWebReady: true,
			bingeGroup: torrent.infoHash,
		},
	};
};

const getStreamDescription = (torrent: FullTorrent, isRecommended: boolean): string => {
	const language = HUNGARIAN_CATEGORIES.includes(torrent.category) ? Language.HU : Language.EN;
	const languageEmoji = languageEmojiMap[language];
	const ncoreResolution = NcoreService.getNcoreResolutionByCategory(torrent.category);
	const fileSize = torrent.files[torrent.fileIndex]?.length;
	const fileSizeString = fileSize ? formatBytes(fileSize) : '';

	const recommendedLine = isRecommended ? '⭐️ Recommended\n' : '';
	const typeLine = `${languageEmoji} | ${ncoreResolution.toUpperCase()}(${torrent.resolution}) | ${fileSizeString}\n`;
	return recommendedLine + typeLine + torrent.release_name;
};

const getLanguageByCategory = (category: NcoreService.TorrentCategory): Language => {
	return HUNGARIAN_CATEGORIES.includes(category) ? Language.HU : Language.EN;
};

export const orderTorrents = ({
	torrents,
	user,
}: {
	torrents: FullTorrent[];
	user: User;
}): FullTorrent[] => {
	const { preferred_lang: preferredLang, preferred_resolutions: preferredResolutions } = user;
	return rateList(torrents, [
		({ category }) => (preferredLang === getLanguageByCategory(category) ? 3 : 0),
		({ resolution }) => (preferredResolutions.includes(resolution) ? 2 : 0),
	]);
};
