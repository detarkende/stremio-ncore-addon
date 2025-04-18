import { rm } from 'fs/promises';
import type { AddTorrentRequest, InfoHash, TorrentResponse } from './types';
import { HttpStatusCode } from '@/types/http';
import { throwServerError } from '@/utils/errors';

export class TorrentServerSdk {
  private torrentFilePaths = new Map<InfoHash, string>();
  constructor(private readonly url: string) {}

  public async getTorrent(infoHash: InfoHash): Promise<TorrentResponse | null> {
    try {
      const req = await fetch(`${this.url}/torrents/${infoHash}`);
      if (!req.ok) {
        if (req.status === HttpStatusCode.NOT_FOUND) {
          return null;
        }
        const responseText = await req.text();
        throw Error(
          `Could not find torrent. Status code: ${req.status}. Error: ${responseText}`,
        );
      }
      return (await req.json()) as TorrentResponse;
    } catch (e) {
      throw throwServerError(e, `Failed to get torrent - ${infoHash}`);
    }
  }

  public async getAllTorrents(): Promise<TorrentResponse[]> {
    try {
      const req = await fetch(`${this.url}/torrents`);
      if (!req.ok) {
        const responseText = await req.text();
        throw Error(
          `Failed to get torrents. Status code: ${req.status}. Error: ${responseText}`,
        );
      }
      return (await req.json()) as TorrentResponse[];
    } catch (e) {
      throw throwServerError(e, 'Failed to get all torrents');
    }
  }

  public async addTorrent(torrentFilePath: string): Promise<TorrentResponse> {
    try {
      const req = await fetch(`${this.url}/torrents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: torrentFilePath } satisfies AddTorrentRequest),
      });
      if (!req.ok) {
        const responseText = await req.text();
        throw Error(
          `Could not add torrent. Status code: ${req.status}. Error: ${responseText}`,
        );
      }
      const torrent = (await req.json()) as TorrentResponse;
      this.torrentFilePaths.set(torrent.infoHash, torrentFilePath);
      return torrent;
    } catch (e) {
      throw throwServerError(e, `Failed to add torrent - ${torrentFilePath}`);
    }
  }

  public async deleteTorrent(infoHash: InfoHash): Promise<void> {
    try {
      const req = await fetch(`${this.url}/torrents/${infoHash}`, { method: 'DELETE' });
      if (!req.ok) {
        const responseText = await req.text();
        throw Error(
          `Could not delete torrent. Status code: ${req.status}. Error: ${responseText}`,
        );
      }
      const torrentFilePath = this.torrentFilePaths.get(infoHash);
      if (!torrentFilePath) {
        throw Error(
          `Failed to delete torrent file at path: "${torrentFilePath}". File not found.`,
        );
      }

      await rm(torrentFilePath);
      this.torrentFilePaths.delete(infoHash);
    } catch (e) {
      throw throwServerError(e, `Failed to delete torrent - ${infoHash}`);
    }
  }

  public getFileStreamingUrl(infoHash: InfoHash, filePath: string): string {
    return `${this.url}/torrents/${infoHash}/files/${filePath}`;
  }

  public getHealthCheckUrl(): string {
    return `${this.url}/health-check`;
  }
}
