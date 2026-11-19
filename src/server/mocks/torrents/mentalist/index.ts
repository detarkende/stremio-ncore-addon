import path from 'node:path';
import fs from 'node:fs';
import type { NcoreTorrent } from '@server/app/ncore';
import { SeriesCategory } from '@server/app/ncore';

const filePath = path.resolve(
  import.meta.dirname,
  './[nCore][hdser_hun]The.Mentalist.S01-S07.COMPLETE.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland.torrent',
);
const torrentBuffer = fs.readFileSync(filePath);
const imdbId = 'tt1196946';
const ncoreTorrent: NcoreTorrent = {
  torrent_id: '3037290',
  category: SeriesCategory.HD_HUN,
  release_name:
    'The.Mentalist.S01-S07.COMPLETE.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland',
  details_url: 'https://ncore.pro/torrents.php?action=details&id=3037290',
  download_url:
    'https://ncore.pro/torrents.php?action=download&id=3037290&key=d6052d446248f4a488470200b0de3c6c',
  freeleech: true,
  imdb_id: 'tt1196946',
  imdb_rating: '8.1',
  size: '589355019588',
  type: 'show',
  leechers: '30',
  seeders: '90',
};

export default { ncoreTorrent, torrentBuffer, imdbId };
