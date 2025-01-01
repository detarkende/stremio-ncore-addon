import { existsSync, lstatSync } from 'fs';
import { rm } from 'fs/promises';
import WebTorrent from 'webtorrent';
import { globSync } from 'glob';
import type { ITorrentSourceManager } from '../torrent-source';
import type { TorrentStoreStats } from './types';
import { formatBytes } from '@/utils/bytes';
import { env } from '@/env';

type TorrentFilePath = string;
type InfoHash = string;

export class TorrentStoreService {
  constructor(private torrentSource: ITorrentSourceManager) {}

  private torrentFilePaths = new Map<InfoHash, TorrentFilePath>();
  private client = new WebTorrent({
    dht: false,
    webSeeds: false,
  });

  public addTorrent(torrentFilePath: string): Promise<WebTorrent.Torrent> {
    return new Promise<WebTorrent.Torrent>((resolve, reject) => {
      const torrent = this.client.add(
        torrentFilePath,
        {
          path: env.DOWNLOADS_DIR,
          deselect: true,
        },
        (torrent) => {
          console.log(
            `Torrent ${torrent.name} - ${torrent.infoHash} verified and added.`,
          );
          this.torrentFilePaths.set(torrent.infoHash, torrentFilePath);
          resolve(torrent);
        },
      );
      torrent.on('error', reject);
    });
  }

  public async getTorrent(infoHash: InfoHash) {
    return await this.client.get(infoHash);
  }

  private getTorrentDownloadPath(torrent: WebTorrent.Torrent) {
    const pathWithInfoHash = `${env.DOWNLOADS_DIR}/${
      torrent.name
    } - ${torrent.infoHash.slice(0, 8)}`;
    const pathWithoutInfoHash = `${env.DOWNLOADS_DIR}/${torrent.name}`;
    if (existsSync(pathWithInfoHash) && lstatSync(pathWithInfoHash).isDirectory())
      return pathWithInfoHash;
    if (existsSync(pathWithoutInfoHash) && lstatSync(pathWithoutInfoHash).isDirectory())
      return pathWithoutInfoHash;
    return undefined;
  }

  public async deleteTorrent(infoHash: InfoHash) {
    const torrentFilePath = this.torrentFilePaths.get(infoHash);
    const torrent = await this.getTorrent(infoHash);
    if (!torrent || !torrentFilePath) {
      return;
    }
    const torrentDownloadPath = this.getTorrentDownloadPath(torrent);
    await this.client.remove(infoHash, { destroyStore: false });
    if (torrentDownloadPath) {
      await rm(torrentDownloadPath, { recursive: true });
      console.log(
        `Successfully deleted download for ${torrent.name} - ${torrent.infoHash}.`,
      );
    }
    await rm(torrentFilePath);
    console.log(
      `Successfully deleted torrent file for ${torrent.name} - ${torrent.infoHash}.`,
    );
  }

  public getStoreStats(): TorrentStoreStats[] {
    return this.client.torrents
      .map((torrent) => {
        if (!torrent.infoHash) return null;

        const totalSize = torrent.files.reduce((acc, file) => acc + file.length, 0);
        const downloadedSize = torrent.downloaded;

        return {
          hash: torrent.infoHash ?? 'no hash',
          name: torrent.name ?? 'no name',
          progress: `${((downloadedSize / totalSize) * 100).toFixed(2)}%`,
          size: formatBytes(totalSize),
          downloaded: formatBytes(downloadedSize),
        };
      })
      .filter((item): item is TorrentStoreStats => !!item);
  }

  public async loadExistingTorrents(): Promise<void> {
    console.log('Looking for torrent files...');
    const savedTorrentFilePaths = globSync(`${env.TORRENTS_DIR}/*.torrent`);
    console.log(`Found ${savedTorrentFilePaths.length} torrent files.`);
    await Promise.allSettled(
      savedTorrentFilePaths.map((filePath) => {
        return this.addTorrent(filePath);
      }),
    );
    console.log('Torrent files loaded and verified.');
  }

  public async deleteUnnecessaryTorrents() {
    console.log('Gathering unnecessary torrents...');
    const deletableInfoHashes = await this.torrentSource.getRemovableInfoHashes();
    console.log(`Found ${deletableInfoHashes.length} deletable torrents.`);
    deletableInfoHashes.forEach(async (infoHash) => {
      const torrent = await this.getTorrent(infoHash);
      if (torrent) {
        this.deleteTorrent(infoHash);
        console.log(`Successfully deleted ${torrent.name} - ${torrent.infoHash}.`);
      }
    });
  }
}
