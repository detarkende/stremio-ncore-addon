export class NcoreTorrentNotFoundError extends Error {
  constructor(ncoreId: string) {
    super(`Torrent with nCore ID ${ncoreId} not found`);
    this.name = 'NcoreTorrentNotFoundError';
  }
}
