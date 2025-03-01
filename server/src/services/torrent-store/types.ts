export type InfoHash = string;

export interface TorrentStoreStats {
  hash: InfoHash;
  name: string;
  progress: string;
  size: string;
  downloaded: string;
}

export interface TorrentFileResponse {
  name: string;
  path: string;
  size: number;
  progress: number;
}

export interface TorrentResponse {
  infoHash: InfoHash;
  name: string;
  progress: number;
  size: number;
  downloaded: number;
  files: TorrentFileResponse[];
}

export interface AddTorrentRequest {
  path: string;
}
