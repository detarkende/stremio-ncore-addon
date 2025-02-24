import type { Stream } from 'stremio-addon-sdk';
import type { TorrentDetails } from '../torrent-source';
import type { TorrentFileDetails } from '../torrent-source/types';
import { languageEmojiMap } from './constants';
import { rateList } from '@/utils/rate-list';
import { formatBytes } from '@/utils/bytes';
import { ConfigService } from '../config';

import { User } from '@/types/user';
import { Language } from '@/db/schema/users';

export class StreamService {
  constructor(private configService: ConfigService) {}

  public convertTorrentToStream({
    torrent,
    isRecommended,
    deviceToken,
    season,
    episode,
    preferredLanguage,
  }: {
    torrent: TorrentDetails;
    isRecommended: boolean;
    deviceToken: string;
    season: number | undefined;
    episode: number | undefined;
    preferredLanguage: Language;
  }): Stream {
    const config = this.configService.getConfig();
    const torrentFileIndex = torrent.getMediaFileIndex({ season, episode });

    const sourceName = encodeURIComponent(torrent.sourceName);
    const sourceId = encodeURIComponent(torrent.sourceId);
    const infoHash = encodeURIComponent(torrent.infoHash);
    const fileIndex = encodeURIComponent(torrentFileIndex);

    const description = this.getStreamDescription(
      torrent,
      isRecommended,
      {
        season,
        episode,
      },
      preferredLanguage,
    );
    return {
      url: `${config.addonUrl}/api/auth/${deviceToken}/stream/play/${sourceName}/${sourceId}/${infoHash}/${fileIndex}`,
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
    preferredLanguage: Language,
  ): string {
    const languageEmoji = languageEmojiMap[torrent.getLanguage()];
    const fileIndex = torrent.getMediaFileIndex({ season, episode });
    const file = torrent.files[fileIndex] as TorrentFileDetails;
    const fileSizeString = formatBytes(file.length);

    const isShow = season && episode;
    let mediaType = '';
    switch (preferredLanguage) {
      case Language.HU:
        mediaType = isShow ? 'sorozat' : 'film';
        break;
      default:
        mediaType = isShow ? 'show' : 'movie';
    }

    let recommendedLine = '';
    if (isRecommended && !torrent.isSpeculated) {
      switch (preferredLanguage) {
        case Language.HU:
          recommendedLine = '⭐️ Ajánlott\n';
          break;
        default:
          recommendedLine = '⭐️ Recommended\n';
      }
    }

    let warningLine = '';
    if (torrent.isSpeculated) {
      switch (preferredLanguage) {
        case Language.HU:
          warningLine = `⚠️ Bizonytalan forrás ⚠️\nEz lehet egy másik ${mediaType}!\n`;
          break;
        default:
          warningLine = `⚠️ Speculated source ⚠️\nThis might be a different ${mediaType}!\n`;
      }
    }

    const typeLine = `${languageEmoji} | ${torrent.displayResolution(torrent.getResolution(file.name))} | ${fileSizeString}\n`;
    const title = isShow ? `${file.name}\n` : `${torrent.getName()}\n`;
    const seeders = `⬆️ ${torrent.getSeeders()}\n`;
    return warningLine + recommendedLine + typeLine + title + seeders;
  }

  public async orderTorrents({
    torrents,
    user,
    season,
    episode,
  }: {
    torrents: TorrentDetails[];
    user: User;
    season: number | undefined;
    episode: number | undefined;
  }): Promise<TorrentDetails[]> {
    const { preferredLanguage, preferredResolutions } = user;

    return rateList(torrents, [
      (torrent) => (preferredLanguage === torrent.getLanguage() ? 3 : 0),
      (torrent) => {
        const fileIndex = torrent.getMediaFileIndex({ season, episode });
        const resolution = torrent.getResolution(torrent.files[fileIndex]!.name);
        return preferredResolutions.includes(resolution) ? 2 : 0;
      },
    ]);
  }
}
