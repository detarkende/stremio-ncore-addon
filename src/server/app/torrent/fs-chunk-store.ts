import { mkdir, open, rm } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type { ChunkStore } from 'webtorrent';

type Callback<T = void> = (error: Error | undefined, value?: T) => void;

interface StoreFile {
  path: string;
  length: number;
  offset: number;
  handle?: Promise<FileHandle>;
}

interface StoreOptions {
  path?: string;
  name?: string;
  length?: number;
  files?: Array<{ path: string; length: number; offset?: number }>;
  addUID?: boolean;
}

interface ChunkTarget {
  file: StoreFile;
  from: number;
  to: number;
  offset: number;
}

export class FsChunkStore implements ChunkStore {
  public readonly chunkLength: number;

  private readonly files: StoreFile[];
  private readonly chunkMap: ChunkTarget[][] = [];
  private readonly length: number;
  private readonly lastChunkIndex: number;
  private readonly lastChunkLength: number;
  private readonly destroyPath?: string;
  private closed = false;

  constructor(chunkLength: number, options: StoreOptions = {}) {
    this.chunkLength = Number(chunkLength);
    if (!this.chunkLength) {
      throw new Error('First argument must be a chunk length');
    }

    if (options.files) {
      let offset = 0;
      const basePath =
        options.path && options.addUID && options.name
          ? join(options.path, options.name)
          : options.path;
      this.files = options.files.map((file) => {
        const fileOffset = file.offset ?? offset;
        offset = fileOffset + file.length;
        const filePath = basePath
          ? resolve(join(basePath, file.path))
          : resolve(file.path);
        return { path: filePath, length: file.length, offset: fileOffset };
      });
      this.length = options.files.reduce((sum, file) => sum + file.length, 0);
      this.destroyPath =
        options.addUID && options.path && options.name
          ? resolve(join(options.path, options.name))
          : undefined;
    } else {
      this.length = Number(options.length) || Infinity;
      const filePath = resolve(
        options.path ??
          join('/tmp', options.name ?? `fs-chunk-store-${crypto.randomUUID()}`),
      );
      this.files = [{ path: filePath, length: this.length, offset: 0 }];
    }

    if (options.length != null && options.files && options.length !== this.length) {
      throw new Error('total `files` length is not equal to explicit `length` option');
    }

    if (this.length === Infinity) {
      this.lastChunkIndex = -1;
      this.lastChunkLength = this.chunkLength;
      return;
    }

    this.lastChunkLength = this.length % this.chunkLength || this.chunkLength;
    this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1;
    this.createChunkMap();
  }

  public put(index: number, buffer: Uint8Array, callback: Callback = noop): void {
    if (this.closed) return defer(callback, new Error('Storage is closed'));

    const expectedLength =
      index === this.lastChunkIndex ? this.lastChunkLength : this.chunkLength;
    if (buffer.length !== expectedLength) {
      return defer(callback, new Error(`Chunk length must be ${expectedLength}`));
    }

    const targets =
      this.length === Infinity
        ? [
            {
              file: this.files[0],
              from: 0,
              to: buffer.length,
              offset: index * this.chunkLength,
            },
          ]
        : this.chunkMap[index];
    if (!targets)
      return defer(callback, new Error('no files matching the request range'));

    this.run(async () => {
      await Promise.all(
        targets.map(async (target) => {
          const file = await this.openFile(target.file);
          const data =
            targets.length === 1 ? buffer : buffer.subarray(target.from, target.to);
          await file.write(data, 0, data.length, target.offset);
        }),
      );
    }, callback);
  }

  public get(index: number, callback: Callback<Uint8Array>): void;
  public get(
    index: number,
    options: { offset: number; length: number },
    callback: Callback<Uint8Array>,
  ): void;
  public get(
    index: number,
    options: { offset: number; length: number } | Callback<Uint8Array>,
    callback?: Callback<Uint8Array>,
  ): void {
    const range = typeof options === 'function' ? undefined : options;
    const done = (typeof options === 'function' ? options : callback) ?? noop;
    if (this.closed) return defer(done, new Error('Storage is closed'));

    const chunkLength =
      index === this.lastChunkIndex ? this.lastChunkLength : this.chunkLength;
    const from = range?.offset ?? 0;
    const to = range?.length === undefined ? chunkLength : from + range.length;
    if (from < 0 || to < from || to > chunkLength) {
      return defer(done, new Error('Invalid offset and/or length'));
    }
    let targets =
      this.length === Infinity
        ? [
            {
              file: this.files[0],
              from: 0,
              to: chunkLength,
              offset: index * this.chunkLength,
            },
          ]
        : this.chunkMap[index];
    if (!targets) return defer(done, new Error('no files matching the request range'));
    if (range) {
      targets = targets.filter((target) => target.to > from && target.from < to);
    }
    if (targets.length === 0) {
      return defer(done, new Error('no files matching the requested range'));
    }
    if (from === to) return defer(done, undefined, new Uint8Array(0));

    this.run(async () => {
      const buffers = await Promise.all(
        targets.map(async (target) => {
          const targetFrom = Math.max(target.from, from);
          const targetTo = Math.min(target.to, to);
          const buffer = Buffer.alloc(targetTo - targetFrom);
          const file = await this.openFile(target.file);
          await file.read(
            buffer,
            0,
            buffer.length,
            target.offset + targetFrom - target.from,
          );
          return buffer;
        }),
      );
      return Buffer.concat(buffers);
    }, done);
  }

  public close(callback: Callback = noop): void {
    if (this.closed) return defer(callback, new Error('Storage is closed'));
    this.closed = true;
    this.run(async () => {
      await Promise.all(
        this.files.map(async (file) => {
          if (file.handle) (await file.handle).close();
        }),
      );
    }, callback);
  }

  public destroy(callback: Callback = noop): void {
    this.close((closeError) => {
      if (closeError) return callback(closeError);
      this.run(async () => {
        if (this.destroyPath) {
          await rm(this.destroyPath, { recursive: true, force: true });
        } else {
          await Promise.all(this.files.map((file) => rm(file.path, { force: true })));
        }
      }, callback);
    });
  }

  private createChunkMap(): void {
    for (const file of this.files) {
      const firstChunk = Math.floor(file.offset / this.chunkLength);
      const lastChunk = Math.floor((file.offset + file.length - 1) / this.chunkLength);
      for (let index = firstChunk; index <= lastChunk; index++) {
        const chunkStart = index * this.chunkLength;
        const from = Math.max(0, file.offset - chunkStart);
        const to = Math.min(this.chunkLength, file.offset + file.length - chunkStart);
        (this.chunkMap[index] ??= []).push({
          file,
          from,
          to,
          offset: Math.max(0, chunkStart - file.offset),
        });
      }
    }
  }

  private openFile(file: StoreFile): Promise<FileHandle> {
    file.handle ??= mkdir(dirname(file.path), { recursive: true }).then(() =>
      open(file.path, 'r+').catch(() => open(file.path, 'w+')),
    );
    return file.handle;
  }

  private run<T>(operation: () => Promise<T>, callback: Callback<T>): void {
    operation().then(
      (value) => callback(undefined, value),
      (error: unknown) =>
        callback(error instanceof Error ? error : new Error(String(error))),
    );
  }
}

function defer<T>(callback: Callback<T>, error?: Error, value?: T): void {
  queueMicrotask(() => callback(error, value));
}

function noop(): void {}
