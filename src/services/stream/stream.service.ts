import type { Stream } from 'stremio-addon-sdk';
import type { FullTorrent } from './types';
import { HUNGARIAN_CATEGORIES, languageEmojiMap } from './constants';
import { config } from '@/config';
import type { NcoreService, TorrentCategory } from '@/services/ncore';
import { Language } from '@/schemas/language.schema';
import type { User } from '@/schemas/user.schema';
import { rateList } from '@/utils/rate-list';
import { formatBytes } from '@/utils/bytes';

export class StreamService {
	constructor(private ncoreService: NcoreService) {}

	public convertTorrentToStream({
		torrent,
		isRecommended,
		jwt,
	}: {
		torrent: FullTorrent;
		isRecommended: boolean;
		jwt: string;
	}): Stream {
		const torrentId = encodeURIComponent(torrent.torrent_id);
		const infoHash = encodeURIComponent(torrent.infoHash);
		const fileIndex = encodeURIComponent(torrent.fileIndex);

		return {
			url: `${config.ADDON_URL}/auth/${jwt}/stream/play/${torrentId}/${infoHash}/${fileIndex}`,
			title: this.getStreamDescription(torrent, isRecommended),
			behaviorHints: {
				notWebReady: true,
				bingeGroup: torrent.infoHash,
			},
		};
	}

	private getStreamDescription(torrent: FullTorrent, isRecommended: boolean): string {
		const language = HUNGARIAN_CATEGORIES.includes(torrent.category)
			? Language.HU
			: Language.EN;
		const languageEmoji = languageEmojiMap[language];
		const ncoreResolution = this.ncoreService.getNcoreResolutionByCategory(torrent.category);
		const fileSize = torrent.files[torrent.fileIndex]?.length;
		const fileSizeString = fileSize ? formatBytes(fileSize) : '';

		const recommendedLine = isRecommended ? '⭐️ Recommended\n' : '';
		const typeLine = `${languageEmoji} | ${ncoreResolution.toUpperCase()}(${torrent.resolution}) | ${fileSizeString}\n`;
		return recommendedLine + typeLine + torrent.release_name;
	}

	private getLanguageByCategory(category: TorrentCategory): Language {
		return HUNGARIAN_CATEGORIES.includes(category) ? Language.HU : Language.EN;
	}

	public orderTorrents({
		torrents,
		user,
	}: {
		torrents: FullTorrent[];
		user: User;
	}): FullTorrent[] {
		const { preferred_lang: preferredLang, preferred_resolutions: preferredResolutions } = user;
		return rateList(torrents, [
			({ category }) => (preferredLang === this.getLanguageByCategory(category) ? 3 : 0),
			({ resolution }) => (preferredResolutions.includes(resolution) ? 2 : 0),
		]);
	}
}
