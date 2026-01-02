declare module 'webtorrent' {
  import type { RequestOptions, Server } from 'http';
  import type { EventEmitter } from 'events';
  import type { default as Bitfield } from 'bitfield';
  import type { Wire } from 'bittorrent-protocol';
  import type { Instance as ParseTorrent } from 'parse-torrent';
  import type { Instance as SimplePeer } from 'simple-peer';

  interface Options {
    /**
     * Max number of connections per torrent
     * @default 55
     */
    maxConns?: number | undefined;
    /**
     * DHT protocol node ID
     * @default random
     */
    nodeId?: string | Buffer | undefined;
    /**
     * Wire protocol peer ID
     * @default random
     */
    peerId?: string | Buffer | undefined;
    /**
     * Enable trackers, or options object for Tracker
     * @default true
     */
    tracker?: boolean | object | undefined;
    /**
     * Enable DHT, or options object for DHT
     * @default true
     */
    dht?: boolean | object | undefined;
    /**
     * Enable BEP14 local service discovery
     * @default true
     */
    lsd?: boolean | undefined;
    /**
     * Enable BEP11 Peer Exchange
     * @default true
     */
    utPex?: boolean;
    /**
     * Enable NAT port mapping via NAT-UPnP. NodeJS only
     * @default true
     */
    natUpnp?: boolean | string;
    /**
     * Enable NAT port mapping via NAT-PMP. NodeJS only.
     * @default true
     */
    natPmp?: boolean;
    /**
     * Enable BEP19 web seeds
     * @default true
     */
    webSeeds?: boolean;
    /**
     * Enable BEP29 uTorrent transport protocol
     * @default true
     */
    utp?: boolean;
    /**
     * Enable outgoing connections when seeding
     * @default true
     */
    seedOutgoingConnections?: boolean;
    /**
     * List of IP's to block
     */
    blocklist?: string | string[];
    /**
     * Max download speed (bytes/sec) over all torrents
     * If set to -1, there is no limit.
     * @default -1
     */
    downloadLimit?: number;
    /**
     * Max upload speed (bytes/sec) over all torrents
     * If set to -1, there is no limit.
     * @default -1
     */
    uploadLimit?: number;
    /**
     * Port to listen for incoming connections
     * If set to 0, a random port will be used.
     * @default 0
     */
    torrentPort?: number;
  }

  interface ServerAddress {
    port: number;
    family: string;
    address: string;
  }

  interface BrowserServerOptions {
    controller: ServiceWorkerRegistration;
  }

  interface NodeServerOptions {
    origin?: string;
    pathname?: string;
    hostname?: string;
  }

  interface ServerBase {
    client: Instance;
    pathname: string;
    listen(port?: number): void;
    address(): ServerAddress;
    close(cb?: () => void): void;
    destroy(cb?: () => void): void;
  }

  interface NodeServer extends ServerBase {
    opts: NodeServerOptions;
  }

  interface BrowserServer extends ServerBase {
    opts: BrowserServerOptions;
    registration: ServiceWorkerRegistration;
    workerKeepAliveInterval: typeof setInterval | null;
    workerPortCount: number;
  }

  interface ChunkStoreOptions {
    /**
     *  size of all the files in the torrent
     */
    length: number;
    /**
     *  an array of torrent file objects
     */
    files: TorrentFile[];
    /**
     *  the torrent instance being stored
     */
    torrent: Torrent;
    /**
     *  path to the store, based on `opts.path`
     */
    path: string;
    /**
     *  the info hash of the torrent instance being stored
     */
    name: string;
    /**
     *  tells the store if it should include an UID in it's file paths
     */
    addUID: boolean;
    /**
     *  if supported by the browser, allows the user to specify a custom directory to stores the files in, retaining the torrent's folder and file structure
     *
     * (browser only)
     */
    rootDir: FileSystemDirectoryHandle;
  }

  class ChunkStore {
    constructor(chunkLength: number, options?: ChunkStoreOptions);
    public readonly chunkLength: number;
    public put(
      index: number,
      chunkBuffer: Uint8Array,
      callBack?: (err: Error | undefined) => void,
    ): void;
    public get(
      index: number,
      callBack?:
        | ((err: Error, chunkBuffer: undefined) => void)
        | ((err: undefined, chunkBuffer: Uint8Array) => void),
    ): void;
    public get(
      index: number,
      options: { offset: number; length: number },
      callBack?:
        | ((err: Error, chunkBuffer: undefined) => void)
        | ((err: undefined, chunkBuffer: Uint8Array) => void),
    ): void;
    public close(callBack?: (err: Error | undefined) => void): void;
    public destroy(callBack?: (err: Error | undefined) => void): void;
  }

  export interface TorrentOptions {
    /**
     * Torrent trackers to use (added to list in .torrent or magnet uri)
     */
    announce?: string[];
    /**
     * Custom callback to allow sending extra parameters to the tracker
     */
    getAnnounceOpts?: () => object;
    /**
     * Array of web seeds
     */
    urlList?: string[];
    /**
     * Folder to download files to
     * @default '/tmp/webtorrent/'
     */
    path?: string;
    /**
     * If true, the torrent will be stored in it's infoHash folder to prevent file name collisions
     * @default false
     *
     * (Node.js only)
     */
    addUID?: boolean;
    /**
     * if supported by the browser, allows the user to specify a custom directory to stores the files in, retaining the torrent's folder and file structure
     *
     * (browser only)
     */
    rootDir?: FileSystemDirectoryHandle;
    /**
     * If true, client will skip verification of pieces for existing store and assume it's correct
     */
    skipVerify?: boolean;
    /**
     * Preloaded numerical array/buffer to use to know what pieces are already downloaded (any type accepted by UInt8Array constructor is valid)
     */
    bitfield?: Uint8Array;
    /**
     * Custom chunk store
     */
    store?: ChunkStore;
    /**
     * Custom, pre-loaded chunk store
     */
    preloadedStore?: ChunkStore;
    /**
     * Number of chunk store entries (torrent pieces) to cache in memory; `0` to disable caching
     * @default 20
     */
    storeCacheSlots?: number;
    /**
     * If truthy, client will delete the torrent's chunk store (e.g. files on disk) when the torrent is destroyed
     */
    destroyStoreOnDestroy?: boolean;
    /**
     * Custom options passed to the store
     */
    storeOpts?: ChunkStoreOptions;
    /**
     * If true, client will automatically choke seeders if it's seeding.
     * @default true
     */
    alwaysChokeSeeders?: boolean;
    /**
     * If true, client will not share the hash with the DHT nor with PEX
     * @default whatever the parsed torrent privacy is
     */
    private?: boolean;
    /**
     * Piece selection strategy, `rarest` or `sequential`
     * @default 'sequential'
     */
    strategy?: 'rarest' | 'sequential';
    /**
     * Max number of simultaneous connections per web seed
     * @default 4
     */
    maxWebConns?: number;
    /**
     * @default 10
     */
    uploads?: number | false;
    /**
     * The amount of time (in seconds) to wait between each check of the `noPeers` event
     * @default 30
     */
    noPeersIntervalTime?: number;
    /**
     * If true, create the torrent with no pieces selected
     * @default false
     */
    deselect?: boolean;
    /**
     * If true, create the torrent in a paused state
     * @default false
     */
    paused?: boolean;
    /**
     * An array containing a UNIX timestamp indicating the last change for each file of the torrent
     */
    fileModtimes?: number[];
  }

  interface TorrentDestroyOptions {
    destroyStore?: boolean | undefined;
  }

  export class Instance extends EventEmitter {
    constructor(config?: Options);
    WEBRTC_SUPPORT: boolean;

    /**
     * Emitted when a torrent is added to client.torrents. This allows attaching to torrent events that may be emitted before the client 'torrent' event is emitted. See the torrent section for more info on what methods a torrent has.
     */
    on(event: 'add', callback: (torrent: Torrent) => void): this;
    /**
     * Emitted when a torrent is removed from client.torrents. See the torrent section for more info on what methods a torrent has.
     */
    on(event: 'remove', callback: (torrent: Torrent) => void): this;
    /**
     * Emitted when a torrent is ready to be used (i.e. metadata is available and store is ready). See the torrent section for more info on what methods a torrent has.
     */
    on(event: 'torrent', callback: (torrent: Torrent) => void): this;
    /**
     * Emitted when the client encounters a fatal error. The client is automatically destroyed and all torrents are removed and cleaned up when this occurs.
     *
     * Always listen for the 'error' event.
     */
    on(event: 'error', callback: (err: Error | string) => void): this;

    add(
      torrent: string | Buffer | File | ParseTorrent,
      opts?: TorrentOptions,
      cb?: (torrent: Torrent) => void,
    ): Torrent;
    add(
      torrent: string | Buffer | File | ParseTorrent,
      cb?: (torrent: Torrent) => void,
    ): Torrent;

    seed(
      input:
        | string
        | string[]
        | File
        | File[]
        | FileList
        | Buffer
        | Buffer[]
        | NodeJS.ReadableStream
        | NodeJS.ReadableStream[],
      opts?: TorrentOptions,
      cb?: (torrent: Torrent) => void,
    ): Torrent;
    seed(
      input:
        | string
        | string[]
        | File
        | File[]
        | FileList
        | Buffer
        | Buffer[]
        | NodeJS.ReadableStream
        | NodeJS.ReadableStream[],
      cb?: (torrent: Torrent) => void,
    ): Torrent;

    remove(
      torrentId: Torrent | string | Buffer,
      opts?: TorrentDestroyOptions,
      callback?: (err: Error | string) => void,
    ): Promise<void>;

    destroy(callback?: (err: Error | string) => void): void;
    createServer(
      opts?: BrowserServerOptions | NodeServerOptions,
      force?: 'browser' | 'node',
    ): NodeServer | BrowserServer;

    readonly torrents: Torrent[];

    get(torrentId: Torrent | string | Buffer): Promise<Torrent | null>;

    throttleDownload(rate: number): boolean | undefined;

    throttleUpload(rate: number): boolean | undefined;

    readonly downloadSpeed: number;

    readonly uploadSpeed: number;

    readonly progress: number;

    readonly ratio: number;
  }

  interface Torrent extends NodeJS.EventEmitter {
    readonly infoHash: string;

    readonly magnetURI: string;

    readonly torrentFile: Uint8Array;

    readonly torrentFileBlob: string;

    readonly files: TorrentFile[];

    readonly announce: string[];

    readonly pieces: Array<TorrentPiece | null>;

    readonly timeRemaining: number;

    readonly received: number;

    readonly downloaded: number;

    readonly uploaded: number;

    readonly downloadSpeed: number;

    readonly uploadSpeed: number;

    /** Progress as number between `0` and `1` (50% = `0.5`) */
    readonly progress: number;

    /** Torrent "seed ratio" (uploaded / downloaded). */
    readonly ratio: number;

    readonly length: number;

    readonly pieceLength: number;

    readonly lastPieceLength: number;

    readonly numPeers: number;

    readonly path: string;

    readonly ready: boolean;

    readonly paused: boolean;

    readonly done: boolean;

    readonly name: string;

    readonly created: Date;

    /** Author of the torrent. */
    readonly createdBy: string;

    /** Comment from the torrent file. */
    readonly comment: string;

    readonly maxWebConns: number;

    bitfield: Bitfield;

    destroy(opts?: TorrentDestroyOptions, cb?: (err: Error | string) => void): void;

    addPeer(peer: string | SimplePeer): boolean;

    addWebSeed(url: string): void;

    removePeer(peer: string | SimplePeer): void;

    select(start: number, end: number, priority?: number, notify?: () => void): void;

    deselect(start: number, end: number, priority: number): void;

    createServer(opts?: RequestOptions): Server;

    pause(): void;

    resume(): void;

    on(event: 'infoHash' | 'metadata' | 'ready' | 'done', callback: () => void): this;

    on(event: 'warning' | 'error', callback: (err: Error | string) => void): this;

    on(event: 'download' | 'upload', callback: (bytes: number) => void): this;

    on(event: 'wire', callback: (wire: Wire, addr?: string) => void): this;

    on(event: 'noPeers', callback: (announceType: 'tracker' | 'dht') => void): this;

    on(event: 'verified', callback: (pieceIndex: number) => void): this;
  }

  interface TorrentFile extends NodeJS.EventEmitter {
    readonly name: string;

    readonly path: string;

    readonly length: number;

    readonly downloaded: number;

    readonly progress: number;

    readonly offset: number;

    readonly type: string;

    get streamURL(): string;

    select(): void;

    deselect(): void;

    createReadStream(opts?: { start: number; end: number }): NodeJS.ReadableStream;

    stream(opts?: { start: number; end: number }): ReadableStream;

    appendTo(
      rootElement: HTMLElement | string,
      opts?: {
        autoplay?: boolean | undefined;
        controls?: boolean | undefined;
        maxBlobLength?: number | undefined;
      },
      callback?: (err: Error | undefined, element: HTMLMediaElement) => void,
    ): void;
    appendTo(
      rootElement: HTMLElement | string,
      callback?: (err: Error | undefined, element: HTMLMediaElement) => void,
    ): void;

    renderTo(
      rootElement: HTMLMediaElement | string,
      opts?: {
        autoplay?: boolean | undefined;
        controls?: boolean | undefined;
        maxBlobLength?: number | undefined;
      },
      callback?: (err: Error | undefined, element: HTMLMediaElement) => void,
    ): void;
    renderTo(
      rootElement: HTMLMediaElement | string,
      callback?: (err: Error | undefined, element: HTMLMediaElement) => void,
    ): void;

    getBlob(callback: (err: string | Error | undefined, blob?: Blob) => void): void;

    getBlobURL(
      callback: (err: string | Error | undefined, blobURL?: string) => void,
    ): void;

    [Symbol.asyncIterator]: (opts: { start: number; end: number }) => FileIterator;
  }

  interface FileIterator extends AsyncIterator<Uint8Array> {
    [Symbol.asyncIterator]: () => AsyncIterator<Uint8Array>;
  }

  interface TorrentPiece {
    readonly length: number;

    readonly missing: number;
  }

  export default Instance;
  export { Torrent, TorrentFile };
}
