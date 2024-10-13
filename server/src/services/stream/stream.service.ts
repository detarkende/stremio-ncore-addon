import type { Stream } from 'stremio-addon-sdk';
import type { TorrentDetails } from '../torrent-source';
import type { TorrentFileDetails } from '../torrent-source/types';
import { languageEmojiMap } from './constants';
import { config } from '@/config';
import type { User } from '@/schemas/user.schema';
import { rateList } from '@/utils/rate-list';
import { formatBytes } from '@/utils/bytes';

export class StreamService {
  constructor() {}

  public convertTorrentToStream({
    torrent,
    isRecommended,
    jwt,
    season,
    episode,
  }: {
    torrent: TorrentDetails;
    isRecommended: boolean;
    jwt: string;
    season: number | undefined;
    episode: number | undefined;
  }): Stream {
    const torrentFileIndex = torrent.getMediaFileIndex({ season, episode });

    const sourceName = encodeURIComponent(torrent.sourceName);
    const sourceId = encodeURIComponent(torrent.sourceId);
    const infoHash = encodeURIComponent(torrent.infoHash);
    const fileIndex = encodeURIComponent(torrentFileIndex);

    const description = this.getStreamDescription(torrent, isRecommended, { season, episode });
    return {
      url: `${config.ADDON_URL}/api/auth/${jwt}/stream/play/${sourceName}/${sourceId}/${infoHash}/${fileIndex}`,
      description,
      behaviorHints: {
        notWebReady: true,
        bingeGroup: torrent.infoHash,
      },
    };
  }

  private getStreamDescription(
    torrent: TorrentDetails,
    isRecommended: boolean,
    { season, episode }: { season: number | undefined; episode: number | undefined },
  ): string {
    const languageEmoji = languageEmojiMap[torrent.getLanguage()];
    const fileIndex = torrent.getMediaFileIndex({ season, episode });
    const file = torrent.files[fileIndex] as TorrentFileDetails;
    const fileSizeString = formatBytes(file.length);

    const recommendedLine = isRecommended ? '⭐️ Recommended\n' : '';
    const typeLine = `${languageEmoji} | ${torrent.displayResolution(torrent.getResolution(file.name))} | ${fileSizeString}\n`;
    return recommendedLine + typeLine + torrent.getName();
  }

  public orderTorrents({
    torrents,
    user,
    season,
    episode,
  }: {
    torrents: TorrentDetails[];
    user: User;
    season: number | undefined;
    episode: number | undefined;
  }): TorrentDetails[] {
    const { preferred_lang: preferredLang, preferred_resolutions: preferredResolutions } = user;
    return rateList(torrents, [
      (torrent) => (preferredLang === torrent.getLanguage() ? 3 : 0),
      (torrent) => {
        const fileIndex = torrent.getMediaFileIndex({ season, episode });
        const resolution = torrent.getResolution(torrent.files[fileIndex]!.name);
        return preferredResolutions.includes(resolution) ? 2 : 0;
      },
    ]);
  }
}
