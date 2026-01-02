import type { Stream } from 'stremio-addon-sdk';
import { env } from 'src/env';
import type { Resolution } from 'src/db/schema/users';
import { Language } from 'src/db/schema/users';
import { rateList } from 'src/utils/rate-list';
import { formatBytes } from 'src/utils/bytes';
import type { TorrentDetails, TorrentFileDetails } from '../torrent';
import type { StreamType } from './stream.constants';
import { cinemetaResponseSchema, languageEmojiMap } from './stream.constants';
import type { CinemetaResponse } from './stream.constants';

export async function getCinemetaData(
  type: StreamType,
  imdbId: string,
): Promise<CinemetaResponse> {
  try {
    const cinemetaUrl = `${env.CINEMETA_URL}/meta/${type}/${imdbId}.json`;
    const response = await fetch(cinemetaUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata from Cinemeta.', { cause: response });
    }
    const respionseData = await response.json();
    const parseResult = cinemetaResponseSchema.safeParse(respionseData);
    if (parseResult.success) {
      return parseResult.data;
    }
    throw new Error('Invalid response from Cinemeta', { cause: parseResult.error });
  } catch (error) {
    throw new Error('Error fetching metadata from Cinemeta', { cause: error });
  }
}

export function orderTorrents<T extends TorrentDetails>({
  torrents,
  preferences: { preferredLanguage, preferredResolutions },
  type,
  season,
  episode,
}: {
  torrents: T[];
  preferences: {
    preferredLanguage: Language;
    preferredResolutions: Resolution[];
  };
  type: StreamType;
  season: string;
  episode: string;
}): T[] {
  return rateList(torrents, [
    (torrent) => (preferredLanguage === torrent.getLanguage() ? 3 : 0),
    (torrent) => {
      // By this point, we have filtered out torrents where the searched file is not found
      const file = torrent.getSearchedFile({
        season,
        episode,
        type,
      }) as TorrentFileDetails;
      const resolution = torrent.getFileResolution(file.name);
      return preferredResolutions.includes(resolution) ? 2 : 0;
    },
  ]);
}

export function convertTorrentToStream({
  torrent,
  token,
  file,
  isRecommended,
  addonUrl,
  preferredLanguage,
  type,
  imdbId,
}: {
  torrent: TorrentDetails;
  token: string;
  file: TorrentFileDetails;
  isRecommended: boolean;
  preferredLanguage: Language;
  addonUrl: string;
  type: StreamType;
  imdbId: string;
}): Stream {
  const description = getStreamDescription({
    fileName: file.name,
    fileSize: file.length,
    isRecommended,
    isSpeculated: Boolean(torrent.isSpeculated),
    displayLanguage: preferredLanguage,
    torrentLanguage: torrent.getLanguage(),
    resolution: torrent.displayResolution(torrent.getFileResolution(file.name)),
    seeders: torrent.getSeeders(),
  });

  const url = new URL(`${addonUrl}/api/auth/${token}/stream`);
  url.searchParams.append('type', type);
  url.searchParams.append('imdbId', imdbId);
  url.searchParams.append('torrentSourceId', torrent.sourceId);
  url.searchParams.append('infoHash', torrent.infoHash);
  url.searchParams.append('filePath', file.path);

  return {
    infoHash: torrent.infoHash,
    url: url.toString(),
    description,
    fileIdx: torrent.files.indexOf(file),
    name: 'stremio-ncore-addon',
    behaviorHints: {
      filename: file.name,
      bingeGroup: `stremio-ncore-addon/${torrent.sourceName}/${torrent.sourceId}`,
      videoSize: file.length,
      notWebReady: true,
    },
  };
}

export function getStreamDescription({
  displayLanguage,
  torrentLanguage,
  fileName,
  fileSize,
  isRecommended,
  isSpeculated,
  resolution,
  seeders,
}: {
  displayLanguage: Language;
  torrentLanguage: Language;
  isRecommended: boolean;
  isSpeculated: boolean;
  fileSize: number;
  fileName: string;
  resolution: string;
  seeders: number;
}): string {
  const languageEmoji = languageEmojiMap[torrentLanguage];
  const fileSizeString = formatBytes(fileSize);

  let recommendedLine = '';
  if (isRecommended && !isSpeculated) {
    switch (displayLanguage) {
      case Language.HU:
        recommendedLine = '⭐️ Ajánlott\n';
        break;
      default:
        recommendedLine = '⭐️ Recommended\n';
    }
  }

  let warningLine = '';
  if (isSpeculated) {
    switch (displayLanguage) {
      case Language.HU:
        warningLine = `⚠️ Bizonytalan forrás ⚠️\nEz lehet egy másik torrent!\n`;
        break;
      default:
        warningLine = `⚠️ Speculated source ⚠️\nThis might be a different torrent!\n`;
    }
  }
  const typeLine = `${languageEmoji} | ${resolution} | ${fileSizeString}\n`;
  const title = `${fileName}\n`;
  const seedersString = `⬆️ ${seeders}`;
  const description = warningLine + recommendedLine + typeLine + title + seedersString;
  return description;
}
