import type { Stream } from 'stremio-addon-sdk';
import type { FullTorrent } from './types';
import { languageEmojiMap } from './constants';
import { config } from '@/config';
import type { TorrentSource } from '@/services/torrent-source';
import type { User } from '@/schemas/user.schema';
import { rateList } from '@/utils/rate-list';
import { formatBytes } from '@/utils/bytes';

export class StreamService {
	constructor(private torrentSource: TorrentSource) {}

	public convertTorrentToStream({
		torrent,
		isRecommended,
		jwt,
	}: {
		torrent: FullTorrent;
		isRecommended: boolean;
		jwt: string;
	}): Stream {
		const torrentId = encodeURIComponent(torrent.sourceId);
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
		const languageEmoji = languageEmojiMap[torrent.getLanguage()];
		const fileSize = torrent.files[torrent.fileIndex]?.length;
		const fileSizeString = fileSize ? formatBytes(fileSize) : '';

		const recommendedLine = isRecommended ? '⭐️ Recommended\n' : '';
		const typeLine = `${languageEmoji} | ${torrent.displayResolution(torrent.resolution)} | ${fileSizeString}\n`;
		return recommendedLine + typeLine + torrent.getName();
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
			(torrent) => (preferredLang === torrent.getLanguage() ? 3 : 0),
			({ resolution }) => (preferredResolutions.includes(resolution) ? 2 : 0),
		]);
	}
}
