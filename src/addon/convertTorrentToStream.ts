import type { Stream } from 'stremio-addon-sdk';
import { getStreamDescription } from './getStreamDescription';
import { config } from '@/common/config/config';
import { rateList } from '@/common/helpers/narrowResults';
import { jwtToUser } from '@/common/helpers/user';

import type { FullTorrent } from '@/ncore/getTorrents';

export const convertTorrentsToStreams = async ({
	torrents,
	jwt,
	origin = config.ADDON_URL,
}: {
	torrents: FullTorrent[];
	jwt: string;
	origin?: string;
}): Promise<Stream[]> => {
	const { first_preferred_lang, preferred_resolutions, second_preferred_lang } = (await jwtToUser(
		jwt,
	))!;

	// Sort the torrents by file size (ascending)
	torrents.sort((a, z) => {
		return a.files[a.selectedFileIdx]!.length - z.files[z.selectedFileIdx]!.length;
	});
	const orderedTorrents = rateList(torrents, [
		// If the torrent has the user's first preferred language, it gets +3 rating point
		({ languages }) => (languages.includes(first_preferred_lang) ? 3 : 0),
		// If the torrent is the same resolution as the user's preference, it gets +2 rating point
		({ resolution }) => (preferred_resolutions.includes(resolution) ? 2 : 0),
		// If the torrent doesn't have the first preferred language, but has the
		// second preferred language, it gets +2 rating point
		({ languages }) =>
			!languages.includes(first_preferred_lang) &&
			second_preferred_lang &&
			languages.includes(second_preferred_lang)
				? 2
				: 0,
	]);

	const streams: Stream[] = orderedTorrents.map((torrent, i) => {
		const isRecommended = i === 0;
		return {
			url: `${origin}/auth/${jwt}/play/${encodeURIComponent(
				torrent.torrent_id,
			)}/${encodeURIComponent(torrent.infoHash)}/${encodeURIComponent(
				torrent.selectedFileIdx,
			)}`,
			title: getStreamDescription(torrent, isRecommended),
			behaviorHints: {
				notWebReady: true,
			},
		};
	});
	return streams;
};
