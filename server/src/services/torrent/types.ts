export type ParsedTorrentDetails = {
  infoHash: string;
  files: {
    name: string;
    path: string;
    length: number;
    offset: number;
  }[];
};
