import parseTorrent from 'parse-torrent';
import contentDisposition from 'content-disposition';
import type { ParsedTorrentDetails } from './types';
import { config } from '@/config';
import { writeFileWithCreateDir } from '@/utils/files';

export class TorrentService {
  public async downloadAndParseTorrent(torrentUrl: string): Promise<ParsedTorrentDetails> {
    const torrentResponse = await fetch(torrentUrl);
    const buffer = await torrentResponse.arrayBuffer();
    const torrentData = await parseTorrent(new Uint8Array(buffer));
    return {
      infoHash: torrentData.infoHash,
      files:
        torrentData.files?.map((file) => ({
          name: file.name,
          length: file.length,
          offset: file.offset,
          path: file.path,
        })) ?? [],
    };
  }

  /**
   * @returns the path to the downloaded torrent file
   */
  public async downloadTorrentFile(torrentUrl: string): Promise<string> {
    const torrentReq = await fetch(torrentUrl);
    const torrentArrayBuffer = await torrentReq.arrayBuffer();
    const parsedTorrent = await parseTorrent(new Uint8Array(torrentArrayBuffer));
    // torrent file name without the .torrent extension
    const torrentFileName = contentDisposition
      .parse(torrentReq.headers.get('content-disposition') ?? '')
      .parameters.filename?.replace(/\.torrent$/i, '');

    const torrentFilePath = `${config.TORRENTS_DIR}/${torrentFileName}-${parsedTorrent.infoHash}.torrent`;

    writeFileWithCreateDir(torrentFilePath, Buffer.from(torrentArrayBuffer));
    return torrentFilePath;
  }
}
