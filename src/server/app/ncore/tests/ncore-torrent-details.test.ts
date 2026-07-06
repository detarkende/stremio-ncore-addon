import { Resolution } from '@ctrl/video-filename-parser';
import { StreamType } from '@server/app/stream/stream.constants';
import { parseTorrentBuffer } from '@server/app/torrent/torrent-file.utils';
import { Language } from '@server/db/schema/users';
import mentalist from '@server/mocks/torrents/mentalist';
import oneBattleAfterAnother from '@server/mocks/torrents/one-battle-after-another';
import { createTestNcoreTorrentResult } from '@server/test-utils/ncore';
import { getRandomString } from '@server/test-utils/random';

import { NcoreTorrentDetails } from '../ncore-torrent-details';
import { MovieCategory, SeriesCategory } from '../ncore.constants';

describe('NcoreTorrentDetails', () => {
  describe('displayResolution', () => {
    it.each([
      { category: MovieCategory.SD_HUN, expected: 'SD' },
      { category: MovieCategory.SD, expected: 'SD' },
      { category: SeriesCategory.SD_HUN, expected: 'SD' },
      { category: SeriesCategory.SD, expected: 'SD' },

      { category: MovieCategory.DVD_HUN, expected: 'DVD' },
      { category: MovieCategory.DVD, expected: 'DVD' },
      { category: SeriesCategory.DVD_HUN, expected: 'DVD' },
      { category: SeriesCategory.DVD, expected: 'DVD' },

      { category: MovieCategory.DVD9_HUN, expected: 'DVD9' },
      { category: MovieCategory.DVD9, expected: 'DVD9' },

      { category: MovieCategory.HD_HUN, expected: 'HD' },
      { category: MovieCategory.HD, expected: 'HD' },
      { category: SeriesCategory.HD_HUN, expected: 'HD' },
      { category: SeriesCategory.HD, expected: 'HD' },
    ])(
      'should return the correct resolution label for category $category',
      ({ category, expected }) => {
        const ncoreTorrent = createTestNcoreTorrentResult({ category });
        const details = new NcoreTorrentDetails(ncoreTorrent, {
          name: ncoreTorrent.release_name,
          infoHash: getRandomString(32),
          files: [],
        });
        const resolution = details.displayResolution(Resolution.R720P);
        expect(resolution).toBe(`${expected} (720P)`);
      },
    );
  });

  describe('getName', () => {
    it('should return the release name', () => {
      const releaseName = 'Test Movie 2024 1080p BluRay x264';
      const ncoreTorrent = createTestNcoreTorrentResult({ release_name: releaseName });
      const details = new NcoreTorrentDetails(ncoreTorrent, {
        name: releaseName,
        infoHash: getRandomString(32),
        files: [],
      });
      expect(details.getName()).toBe(releaseName);
    });
  });

  describe('getLanguage', () => {
    it.each([
      { category: MovieCategory.SD_HUN, expected: Language.HU },
      { category: MovieCategory.DVD_HUN, expected: Language.HU },
      { category: MovieCategory.DVD9_HUN, expected: Language.HU },
      { category: MovieCategory.HD_HUN, expected: Language.HU },
      { category: SeriesCategory.SD_HUN, expected: Language.HU },
      { category: SeriesCategory.DVD_HUN, expected: Language.HU },
      { category: SeriesCategory.HD_HUN, expected: Language.HU },

      { category: MovieCategory.SD, expected: Language.EN },
      { category: MovieCategory.DVD, expected: Language.EN },
      { category: MovieCategory.DVD9, expected: Language.EN },
      { category: MovieCategory.HD, expected: Language.EN },
      { category: SeriesCategory.SD, expected: Language.EN },
      { category: SeriesCategory.DVD, expected: Language.EN },
      { category: SeriesCategory.HD, expected: Language.EN },
    ])(
      'should return the correct language for category $category',
      ({ category, expected }) => {
        const ncoreTorrent = createTestNcoreTorrentResult({ category });
        const details = new NcoreTorrentDetails(ncoreTorrent, {
          name: ncoreTorrent.release_name,
          infoHash: getRandomString(32),
          files: [],
        });
        expect(details.getLanguage()).toBe(expected);
      },
    );
  });

  describe('getSearchedFile', () => {
    describe('tv show episode search', async () => {
      const parsedTorrentDetails = await parseTorrentBuffer(mentalist.torrentBuffer);
      const ncoreTorrent = mentalist.ncoreTorrent;

      it.each([
        {
          season: '1',
          episode: '1',
          expectedFile: expect.objectContaining({
            name: 'The.Mentalist.S01E01.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland.mkv',
          }),
        },
        {
          season: '3',
          episode: '10',
          expectedFile: expect.objectContaining({
            name: 'The.Mentalist.S03E10.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland.mkv',
          }),
        },
        {
          season: '5',
          episode: '20',
          expectedFile: expect.objectContaining({
            name: 'The.Mentalist.S05E20.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland.mkv',
          }),
        },
        // Non-existent episodes
        {
          season: '1',
          episode: '25',
          expectedFile: null,
        },
        {
          season: '8',
          episode: '1',
          expectedFile: null,
        },
      ])(
        'should find the correct file for episode search',
        ({ season, episode, expectedFile }) => {
          const details = new NcoreTorrentDetails(ncoreTorrent, parsedTorrentDetails);
          const file = details.getSearchedFile({
            type: StreamType.TV_SHOW,
            season,
            episode,
          });
          expect(file).toEqual(expectedFile);
        },
      );

      it('should not return sample files even if they match the episode', () => {
        const details = new NcoreTorrentDetails(ncoreTorrent, {
          ...parsedTorrentDetails,
          files: [
            {
              name: 'The.Mentalist.S01E01.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-A-SAMPLE.mkv',
              path: 'The.Mentalist.S01E01.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-A-SAMPLE.mkv',
              length: 123456,
              offset: 0,
            },
            ...parsedTorrentDetails.files,
          ],
        });
        const file = details.getSearchedFile({
          type: StreamType.TV_SHOW,
          season: '1',
          episode: '1',
        });
        expect(file).toEqual(
          expect.objectContaining({
            name: 'The.Mentalist.S01E01.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland.mkv',
          }),
        );
      });
    });

    describe('movie search', async () => {
      const parsedTorrentDetails = await parseTorrentBuffer(
        oneBattleAfterAnother.torrentBuffer,
      );
      const ncoreTorrent = mentalist.ncoreTorrent;

      it('should return the largest file for movie search', () => {
        const details = new NcoreTorrentDetails(ncoreTorrent, parsedTorrentDetails);
        const file = details.getSearchedFile({
          type: StreamType.MOVIE,
          season: '',
          episode: '',
        });

        expect(file).toEqual(
          expect.objectContaining({
            name: 'fulcrum-one.battle.after.another.2025.web.mkv',
          }),
        );
      });
    });
  });
});
