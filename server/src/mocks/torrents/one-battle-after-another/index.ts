import path from 'path';
import fs from 'fs';
import type { NcoreTorrent } from 'src/app/ncore';
import { MovieCategory } from 'src/app/ncore';

const torrentFilePath = path.resolve(
  import.meta.dirname,
  './[nCore][xvid_hun]One.Battle.After.Another.2025.AMZN.WEBRip.x264.HUN-FULCRUM.torrent',
);

const torrentBuffer = fs.readFileSync(torrentFilePath);
const imdbId = 'tt30144839';
const ncoreTorrent: NcoreTorrent = {
  torrent_id: '4051000',
  category: MovieCategory.SD_HUN,
  release_name: 'One.Battle.After.Another.2025.AMZN.WEBRip.x264.HUN-FULCRUM',
  details_url: 'https://ncore.pro/torrents.php?action=details&id=4051000',
  download_url:
    'https://ncore.pro/torrents.php?action=download&id=4051000&key=d6052d446248f4a488470200b0de3c6c',
  freeleech: true,
  imdb_id: 'tt30144839',
  imdb_rating: '8.2',
  size: '4504183428',
  type: 'movie',
  leechers: '792',
  seeders: '7006',
};

export default { ncoreTorrent, torrentBuffer, imdbId };
