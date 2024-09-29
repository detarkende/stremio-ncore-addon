import type { TorrentDetails } from '../torrent-source';
import type { Resolution } from '@/schemas/resolution.schema';

export type FullTorrent = TorrentDetails & {
	fileIndex: number;
	resolution: Resolution;
};
