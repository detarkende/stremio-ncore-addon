import type { Resolution } from '@ctrl/video-filename-parser';
import type { NcoreTorrent } from '../ncore';
import type { ParsedTorrentDetails } from '../torrent';

export type FullTorrent = NcoreTorrent &
	ParsedTorrentDetails & {
		fileIndex: number;
		resolution: Resolution;
	};
