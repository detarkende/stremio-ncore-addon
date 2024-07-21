import { Language } from '@ctrl/video-filename-parser';
import { formatBytes } from '@/common/helpers/bytes';
import type { FullTorrent } from '@/ncore/getTorrents';

export const getStreamDescription = (torrent: FullTorrent, isRecommended: boolean): string => {
	const langEmoji = torrent.languages.map(getLanguageEmoji).join(' ');

	const size = formatBytes(
		Number(torrent.files[torrent.selectedFileIdx]!.length ?? torrent.size),
	);
	const resolution = torrent.resolution ?? torrent.category.toUpperCase();
	return `${isRecommended ? '⭐️ Recommended\n' : ''}${langEmoji} | ${resolution} | ${size}\n${
		torrent.release_name
	}`;
};

const getLanguageEmoji = (lang: Language): string => {
	switch (lang) {
		case Language.Hungarian:
			return '🇭🇺';
		case Language.German:
			return '🇩🇪';
		case Language.French:
			return '🇫🇷';
		default:
			return '🇺🇸';
	}
};
