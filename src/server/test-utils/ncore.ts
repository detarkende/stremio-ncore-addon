import { MovieCategory, SeriesCategory, type NcoreTorrent } from '@server/app/ncore';

import { getRandomBoolean, getRandomInt, getRandomString } from './random';

const categoryArray = [...Object.values(MovieCategory), ...Object.values(SeriesCategory)];

export function createTestNcoreTorrentResult(
  overrides: Partial<NcoreTorrent> = {},
): NcoreTorrent {
  const id = overrides.torrent_id ?? `${getRandomInt(1000, 9999)}`;
  const key = getRandomString(16);
  return {
    torrent_id: id,
    category: categoryArray[getRandomInt(0, categoryArray.length - 1)],
    release_name: `Test.Release.Name.${getRandomString(10)}`,
    details_url: `https://ncore.pro/torrents.php?action=details&id=${id}`,
    download_url: `https://ncore.pro/torrents.php?action=download&id=${id}&key=${key}`,
    freeleech: getRandomBoolean(),
    imdb_id: `tt${getRandomInt(1000000, 9999999)}`,
    imdb_rating: `${getRandomInt(1, 10)}.${getRandomInt(0, 9)}`,
    size: `${getRandomInt(500000000, 50000000000)}`,
    type: getRandomBoolean() ? 'movie' : 'show',
    leechers: `${getRandomInt(0, 100)}`,
    seeders: `${getRandomInt(0, 400)}`,
    ...overrides,
  };
}

export function createTestNcoreTorrentResultArray(
  count: number,
  overrides: Partial<NcoreTorrent> = {},
): NcoreTorrent[] {
  const results: NcoreTorrent[] = [];
  for (let i = 0; i < count; i++) {
    results.push(createTestNcoreTorrentResult(overrides));
  }
  return results;
}
