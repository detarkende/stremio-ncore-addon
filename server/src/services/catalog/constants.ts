export enum Platform {
  RTL = 'RTL+',
  SKYSHOWTIME = 'SkyShowtime',
  APPLETV = 'Apple TV',
  AMAZONPRIME = 'Amazon Prime',
  DISNEY = 'Disney+',
  NETFLIX = 'Netflix',
  HBO = 'HBO',
}

export enum JustWatchPlatform {
  HBO = 'mxx',
  NETFLIX = 'nfx',
  DISNEY = 'dnp',
  AMAZON = 'prv',
  APPLE = 'itu',
  SKYSHOWTIME = 'sst',
}

export enum FlixPatrolPlatform {
  RTL = 'rtl-plus',
}

export const platformInfo = [
  {
    name: Platform.HBO,
    justWatchId: JustWatchPlatform.HBO,
    flixPatrolId: null,
  },
  {
    name: Platform.NETFLIX,
    justWatchId: JustWatchPlatform.NETFLIX,
    flixPatrolId: null,
  },
  {
    name: Platform.DISNEY,
    justWatchId: JustWatchPlatform.DISNEY,
    flixPatrolId: null,
  },
  {
    name: Platform.AMAZONPRIME,
    justWatchId: JustWatchPlatform.AMAZON,
    flixPatrolId: null,
  },
  {
    name: Platform.APPLETV,
    justWatchId: JustWatchPlatform.APPLE,
    flixPatrolId: null,
  },
  {
    name: Platform.SKYSHOWTIME,
    justWatchId: JustWatchPlatform.SKYSHOWTIME,
    flixPatrolId: null,
  },
  {
    name: Platform.RTL,
    justWatchId: null,
    flixPatrolId: FlixPatrolPlatform.RTL,
  },
];
