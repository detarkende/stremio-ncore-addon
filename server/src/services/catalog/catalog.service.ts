import { JSDOM } from 'jsdom';
import { FlixPatrolCategory, categoryMapping, FlixPatrolPlatform } from './constants';
import { Cached, DEFAULT_MAX, DEFAULT_TTL } from '@/utils/cache';
import { Language } from '@/db/schema/users';
import { env } from '@/env';
import { Genre } from '@/types/genre';
import { RecommendedContent } from '../torrent-source/ncore/types';

export class CatalogService {
  @Cached({
    max: DEFAULT_MAX,
    ttl: 6 * 60 * 60, // 6 hours
    ttlAutopurge: true,
    generateKey: (
      preferredLanguage: Language,
      date: string,
      platform: FlixPatrolPlatform,
      type: string,
    ) => `${preferredLanguage}-${date}-${platform}-${type}`,
  })
  public async getTop10ByPlatform(
    preferredLanguage: Language,
    date: string,
    platform: FlixPatrolPlatform,
    type: string,
  ): Promise<RecommendedContent[]> {
    const category = categoryMapping[`${type}-${platform}`];

    if (!category) {
      throw new Error(
        `No category mapping found for type: ${type} and platform: ${platform}`,
      );
    }

    const top10Titles = await this.fetchFlixPatrolTop10(date, platform, category);
    const results: RecommendedContent[] = [];

    for (const title of top10Titles) {
      const tmdbData = await this.searchTMDb(title, preferredLanguage);
      if (tmdbData) {
        results.push({
          id: tmdbData.imdb_id || tmdbData.external_ids.imdb_id,
          name: tmdbData.title || tmdbData.name,
          genre: [],
          poster: `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
          background: `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`,
          imdbRating: tmdbData.vote_average,
          posterShape: 'regular',
          year: (tmdbData.release_date || tmdbData.first_air_date || '').split('-')[0],
          type: tmdbData.media_type === 'movie' ? 'movie' : 'series',
          description: tmdbData.overview,
        });
      }
    }

    return results;
  }

  private async fetchFlixPatrolTop10(
    date: string,
    platform: FlixPatrolPlatform,
    category: FlixPatrolCategory,
  ): Promise<string[]> {
    console.log(
      `Fetching FlixPatrol Top 10 for date: ${date}, platform: ${platform}, category: ${category}`,
    );
    const url = `https://flixpatrol.com/top10/${platform}/hungary/${date}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const expression = `//div[h3[text() = "TOP 10 ${category}"]]/parent::div/following-sibling::div[1]//a[@class="hover:underline"]/text()`;
    const result = document.evaluate(
      expression,
      document,
      null,
      dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    let titles = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeValue) {
        titles.push(node.nodeValue.trim());
      }
    }
    console.log(`Fetched titles: ${titles}`);
    return titles;
  }

  private async searchTMDb(title: string, preferredLanguage: Language) {
    const tmdbApiKey = env.TMDB_API_KEY;
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${title}`,
    );
    const data = await response.json();
    const preferredResult = data.results.sort((a: { title?: string, name?: string, popularity: number }, b: { title?: string, name?: string, popularity: number }) => {
        const aTitle = a.title || a.name;
        const bTitle = b.title || b.name;
        if (aTitle === title && bTitle !== title) return -1;
        if (aTitle !== title && bTitle === title) return 1;
        if (aTitle === title && bTitle === title) return b.popularity - a.popularity;
        return b.popularity - a.popularity;
    })[0];

    const { id, media_type } = preferredResult  || data.results[0];

    if (!id || !media_type){
        return response;
    }
    const userLanguage = preferredLanguage === Language.HU ? 'hu-HU' : 'en-US';
    const localizedResponse = await fetch(`https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}&language=${userLanguage}&append_to_response=external_ids`);
    const localizedData = await localizedResponse.json();
    return {...localizedData, media_type};
  }
}
