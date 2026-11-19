import type { Manifest } from 'stremio-addon-sdk';

export interface CustomManifest extends Manifest {
  baseUrl: string;
}
