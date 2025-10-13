import { rmSync } from 'node:fs';
import { env } from 'src/env';
import { logger } from 'src/logger';
import { type Torrent as WebtorrentTorrent } from 'webtorrent';
import WebTorrent from 'webtorrent';
import type { Torrent } from './torrent.types';
import { getExistingTorrentFilePaths } from './torrent-file.utils';

export const _webtorrent = new WebTorrent({
  torrentPort: env.TORRENT_PORT,
  utp: false,
});

/**
 * Map to store the mapping between infoHash and the corresponding torrent file path.
 */
export const torrentFileMap = new Map<string, string>();

function _mapToTorrentResponse(torrent: WebtorrentTorrent): Torrent {
  return {
    infoHash: torrent.infoHash,
    name: torrent.name,
    size: torrent.length,
    progress: torrent.progress,
    downloaded: torrent.downloaded,
    files: torrent.files.map((file) => ({
      name: file.name,
      path: file.path,
      size: file.length,
      progress: file.progress,
      getStream: file.stream.bind(file),
    })),
  };
}

export async function addTorrent(torrentFilePath: string): Promise<Torrent> {
  try {
    const torrent = await new Promise<WebtorrentTorrent>((resolve, reject) => {
      try {
        _webtorrent.add(
          torrentFilePath,
          {
            path: env.DOWNLOADS_DIR,
            deselect: true,
            storeCacheSlots: 0,
            skipVerify: false,
          },
          (torrent: WebtorrentTorrent) => {
            torrentFileMap.set(torrent.infoHash, torrentFilePath);
            resolve(torrent);
          },
        );
      } catch (error: unknown) {
        reject(error);
      }
    });
    return _mapToTorrentResponse(torrent);
  } catch (error: unknown) {
    logger.error({ error }, `Failed to add torrent from file path "${torrentFilePath}"`);
    throw new Error(`Failed to add torrent from file path "${torrentFilePath}"`, {
      cause: error,
    });
  }
}

export async function getTorrent(infoHash: string): Promise<Torrent | null> {
  const torrent = await _webtorrent.get(infoHash);
  if (!torrent) {
    return null;
  }
  return _mapToTorrentResponse(torrent);
}

export async function deleteTorrent(infoHash: string): Promise<void | Error> {
  try {
    const torrent = await _webtorrent.get(infoHash);
    if (!torrent) {
      logger.warn({ infoHash }, 'Torrent not found when trying to delete');
      return new Error('Torrent not found');
    }
    const torrentFilePath = torrentFileMap.get(infoHash);
    if (!torrentFilePath) {
      logger.warn(
        { infoHash },
        'Torrent file path not found in map when trying to delete',
      );
      return new Error('Torrent file path not found');
    }
    rmSync(torrent.path, { recursive: true });
    rmSync(torrentFilePath);
    torrentFileMap.delete(infoHash);
    torrent.destroy();
    return;
  } catch (error: unknown) {
    logger.error({ error, infoHash }, 'Failed to delete torrent');
    return new Error('Error while deleting torrent', { cause: error });
  }
}

export async function getStoreStats(): Promise<Torrent[]> {
  try {
    const stats = _webtorrent.torrents.map(_mapToTorrentResponse);
    return stats.sort((a, z) => a.name.localeCompare(z.name));
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to get store stats');
    throw new Error('Failed to get store stats', { cause: error });
  }
}

export async function loadExistingTorrents() {
  const torrentPaths = getExistingTorrentFilePaths();
  for (const path of torrentPaths) {
    try {
      await addTorrent(path);
    } catch (error: unknown) {
      logger.error({ error, path }, 'Failed to load existing torrent');
    }
  }
}

// TODO: Implement this function to remove torrents that are no longer needed
export async function deleteUnnecessaryTorrents() {}
