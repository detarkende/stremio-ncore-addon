import { Language } from '@/db/schema/users';
import { Genre } from '@/types/genre';
import { Platform } from '@/services/catalog';

export function getPlatforms(preferredLanguage: Language) {
  return [
    {
      id: 'user.recommendation',
      name: preferredLanguage === Language.EN ? 'For you' : 'Neked',
      type: ['movie', 'series'],
      pageSize: null,
      extra: [],
      extraSupported: [],
    },
    {
      id: 'torrent.trending',
      name: 'nCore',
      type: ['movie', 'series'],
      pageSize: 75,
      extra: [
        { name: 'search' },
        { name: 'genre', options: Genre.getGenres(preferredLanguage) },
        { name: 'skip' },
      ],
      extraSupported: ['genre', 'skip', 'search'],
    },
    {
      id: Platform.NETFLIX,
      name: 'Netflix',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.HBO,
      name: 'Max',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.DISNEY,
      name: 'Disney+',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.AMAZONPRIME,
      name: 'Amazon Prime',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.APPLETV,
      name: 'Apple TV',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.SKYSHOWTIME,
      name: 'SkyShowtime',
      type: ['movie', 'series'],
      pageSize: 10,
      extra: [{ name: 'skip' }],
      extraSupported: [],
    },
    {
      id: Platform.RTL,
      name: 'RTL+ - Top 10',
      type: ['collections'],
      pageSize: 10,
      extra: [],
      extraSupported: [],
    },
  ];
}
