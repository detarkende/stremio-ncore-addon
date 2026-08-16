import { MovieCategory } from '../ncore.constants';
import type { NcorePageResponseJson } from '../ncore.types';
import { getAllPages, getNcoreSearchResults } from '../ncore.utils';

describe('nCore utils', () => {
  const page = (
    totalResults: `${number}`,
    results: NcorePageResponseJson['results'],
  ): NcorePageResponseJson => ({
    results,
    total_results: totalResults,
    onpage: results.length,
    perpage: '2',
  });

  describe('getAllPages', () => {
    it('should combine all available pages', async () => {
      const firstPageResults = [
        { torrent_id: 'first' } as NcorePageResponseJson['results'][number],
      ];
      let getPage = vi.fn(async (pageNumber: number) => {
        if (pageNumber === 1) {
          return page('2', firstPageResults);
        }
        return page('4', []);
      });

      await expect(getAllPages(getPage)).resolves.toEqual(firstPageResults);
      expect(getPage).toHaveBeenCalledWith(1);
    });

    it('should retain successful pages when another page fails', async () => {
      const firstResult = page('4', [
        {
          torrent_id: 'first',
          category: MovieCategory.HD,
          release_name: 'First',
          details_url: '/first',
          download_url: '/first.torrent',
          freeleech: false,
          imdb_id: 'tt0000001',
          imdb_rating: '0',
          size: '1',
          type: 'movie',
          leechers: '0',
          seeders: '1',
        },
      ]);
      let getPage = vi.fn(async (pageNumber: number) => {
        if (pageNumber === 1) {
          return firstResult;
        }
        if (pageNumber === 2) {
          return page('4', []);
        }
        throw new Error('page unavailable');
      });

      await expect(getAllPages(getPage)).resolves.toEqual(firstResult.results);
      expect(getPage).toHaveBeenCalledWith(2);
      expect(getPage).toHaveBeenCalledWith(3);
    });
  });

  describe('getNcoreSearchResults', () => {
    it('should parse a JSON response', () => {
      const response = page('0', []);

      expect(getNcoreSearchResults(JSON.stringify(response))).toEqual(response);
    });

    it('should return an empty response when nCore returns HTML', () => {
      expect(getNcoreSearchResults('<html>No results</html>')).toEqual({
        results: [],
        total_results: '0',
        onpage: 0,
        perpage: '0',
      });
    });
  });
});
