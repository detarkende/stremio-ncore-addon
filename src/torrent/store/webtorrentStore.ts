import { rm } from 'fs/promises';
import { existsSync, lstatSync } from 'fs';
import WebTorrent from 'webtorrent';
import type { TorrentStoreStats } from './index';
import { config } from '@/common/config/config';
import { formatBytes } from '@/common/helpers/bytes';
import { isNotNull } from '@/common/helpers/isNotNull';

type TorrentInfo = {
	torrent: WebTorrent.Torrent;
	torrentFilePath: string;
};

export class TorrentStore {
	private client = new WebTorrent({
		dht: false,
		webSeeds: false,
	});
	private torrents = new Map<string, TorrentInfo>();

	public addTorrent(torrentFilePath: string): Promise<WebTorrent.Torrent> {
		return new Promise<WebTorrent.Torrent>((resolve, reject) => {
			const torrent = this.client.add(
				torrentFilePath,
				{
					path: config.DOWNLOADS_DIR,
					deselect: true,
				},
				(torrent) => {
					console.log(
						`Torrent ${torrent.name} - ${torrent.infoHash} verified and added.`,
					);
					this.torrents.set(torrent.infoHash, { torrent, torrentFilePath });
					resolve(torrent);
				},
			);
			torrent.on('error', reject);
		});
	}

	public async getTorrent(infoHash: string): Promise<WebTorrent.Torrent | undefined> {
		return this.client.get(infoHash);
	}

	public async getTorrentDownloadPath(infoHash: string) {
		const torrent = await this.getTorrent(infoHash);
		if (!torrent) return undefined;
		const pathWithInfoHash = `${config.DOWNLOADS_DIR}/${
			torrent.name
		} - ${torrent.infoHash.slice(0, 8)}`;
		const pathWithoutInfoHash = `${config.DOWNLOADS_DIR}/${torrent.name}`;
		if (existsSync(pathWithInfoHash) && lstatSync(pathWithInfoHash).isDirectory())
			return pathWithInfoHash;
		if (existsSync(pathWithoutInfoHash) && lstatSync(pathWithoutInfoHash).isDirectory())
			return pathWithoutInfoHash;
		return undefined;
	}

	public async deleteTorrent(infoHash: string): Promise<void> {
		const torrentWithMetadata = this.torrents.get(infoHash);
		if (!torrentWithMetadata) return;
		const { torrent, torrentFilePath } = torrentWithMetadata;
		const torrentDownloadPath = await this.getTorrentDownloadPath(infoHash);
		await this.client.remove(infoHash, { destroyStore: false });
		if (torrentDownloadPath) {
			await rm(torrentDownloadPath, { recursive: true });
			console.log(`Successfully deleted download for ${torrent.name} - ${torrent.infoHash}.`);
		}
		await rm(torrentFilePath);
		console.log(`Successfully deleted torrent file for ${torrent.name} - ${torrent.infoHash}.`);
		this.torrents.delete(infoHash);
		console.log(
			`Successfully deleted torrent from store: ${torrent.name} - ${torrent.infoHash}.`,
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
			.filter(isNotNull);
	}
}
