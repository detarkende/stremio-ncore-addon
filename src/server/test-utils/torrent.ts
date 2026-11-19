import crypto from 'crypto';

import WebTorrent, { type Torrent } from 'webtorrent';

export function createMockFile(name: string, length: number = 1024): File {
  const buffer = Buffer.from(crypto.randomBytes(length));
  return new File([buffer], name, { type: 'application/octet-stream' });
}

export async function createSeededTorrent(
  files: File[],
): Promise<{ seededTorrent: Torrent; peerAddress: string; cleanup: () => void }> {
  const seedClient = new WebTorrent({
    dht: false,
    tracker: false,
    utp: false,
    webSeeds: false,
    natPmp: false,
    natUpnp: false,
    lsd: false,
  });

  const torrent = await new Promise<Torrent>((resolve) => {
    seedClient.seed(files, { announce: [] }, (torrent) => {
      resolve(torrent);
    });
  });
  return {
    seededTorrent: torrent,
    peerAddress: seedClient.address().address + ':' + seedClient.address().port,
    cleanup: () => {
      seedClient.destroy();
    },
  };
}
