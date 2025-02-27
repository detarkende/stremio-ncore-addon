import axios from 'axios';
import {JSDOM} from 'jsdom';
import {FlixPatrolPlatform, JustWatchPlatform, Platform, platformInfo,} from './constants';
import {Cached, DEFAULT_MAX} from '@/utils/cache';
import {Language} from '@/db/schema/users';
import {env} from '@/env';
import {RecommendedContent} from '../torrent-source/ncore/types';
import {StreamType} from '@/schemas/stream.schema';

export class CatalogService {
  @Cached({
    max: DEFAULT_MAX,
    ttl: 6 * 60 * 60, // 6 hours
    ttlAutopurge: true,
    generateKey: (
      preferredLanguage: Language,
      platform: Platform,
      type: string,
      skip: number | undefined,
    ) => `${preferredLanguage}-${platform}-${type}-${skip ?? ''}`,
  })
  public async getRecommendedByPlatform(
    preferredLanguage: Language,
    platform: Platform,
    type: string,
    skip: number | undefined,
  ): Promise<RecommendedContent[]> {
    const jPlatformId = platformInfo.find((p) => p.name === platform)?.justWatchId;
    const fPlatformId = platformInfo.find((p) => p.name === platform)?.flixPatrolId;

    let recommendedTitles: { title: string; imdb_id: string }[] = [];
    if (jPlatformId) {
      recommendedTitles = await this.fetchRecommended(jPlatformId, type, skip);
    }
    if (fPlatformId) {
      recommendedTitles = await this.fetchTop10(fPlatformId);
    }
    const results: RecommendedContent[] = [];
    for (const { title, imdb_id } of recommendedTitles) {
      const tmdbData = await this.searchTMDb(title, preferredLanguage);
      if (tmdbData) {
        results.push({
          id: tmdbData.imdb_id || tmdbData.external_ids?.imdb_id || imdb_id,
          name: tmdbData.title || tmdbData.name || title,
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

  private async fetchTop10(
    platform: FlixPatrolPlatform,
  ): Promise<{ title: string; imdb_id: string }[]> {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const formattedDate = date.toISOString().split('T')[0];
    console.log(`Fetching Top 10 for date: ${formattedDate}, platform: ${platform}`);
    const url = `https://flixpatrol.com/top10/${platform}/hungary/${formattedDate}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    //Currently works for RTL+ only,if you want to add new platforms add dynamic expression Top 10 Overall, Top 10 TV Shows, Top 10 Movies based on your manifest data
    const expression = `//div[h3[text() = "TOP 10 Overall"]]/parent::div/following-sibling::div[1]//a[@class="hover:underline"]/text()`;
    const result = document.evaluate(
      expression,
      document,
      null,
      dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    let titles: { title: string; imdb_id: string }[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeValue) {
        titles.push({ title: node.nodeValue.trim(), imdb_id: '' });
      }
    }
    return titles;
  }

  private async fetchRecommended(
    platform: JustWatchPlatform,
    type: string,
    skip: number | undefined,
  ): Promise<{ title: string; imdb_id: string }[]> {
    console.log(`Fetching JustWatch with: ${platform}, type: ${type}`);

    let res = null;
    try {
      res = await axios.post('https://apis.justwatch.com/graphql', {
        operationName: 'GetPopularTitles',
        variables: {
          popularTitlesSortBy: 'TRENDING',
          first: 25,
          platform: 'WEB',
          sortRandomSeed: 0,
          popularAfterCursor: '',
          offset: skip ? skip : null,
          popularTitlesFilter: {
            ageCertifications: [],
            excludeGenres: [],
            excludeProductionCountries: [],
            genres: [],
            objectTypes: [type === StreamType.MOVIE ? 'MOVIE' : 'SHOW'],
            productionCountries: [],
            packages: [platform],
            excludeIrrelevantTitles: false,
            presentationTypes: [],
            monetizationTypes: [],
          },
          language: 'en',
          country:
            platform === JustWatchPlatform.APPLE && type === StreamType.TV_SHOW
              ? 'GB'
              : 'HU',
        },
        query: `query GetPopularTitles($country: Country!, $popularTitlesFilter: TitleFilter, $popularAfterCursor: String, $popularTitlesSortBy: PopularTitlesSorting! = POPULAR, $first: Int!, $language: Language!, $offset: Int = 0, $sortRandomSeed: Int! = 0) { popularTitles(country: $country, filter: $popularTitlesFilter, offset: $offset, after: $popularAfterCursor, sortBy: $popularTitlesSortBy, first: $first, sortRandomSeed: $sortRandomSeed) { edges { node { content(country: $country, language: $language) { externalIds { imdbId } title } } } } }`,
      });
    } catch (error) {
      console.error('Failed to get metadata from JustWatch', error);
      return [];
    }
    return res.data.data.popularTitles.edges.map((edge: any) => ({
      title: edge.node.content.title,
      imdb_id: edge.node.content.externalIds.imdb_id,
    }));
  }

  private async searchTMDb(title: string, preferredLanguage: Language) {
    const tmdbApiKey = env.TMDB_API_KEY;
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${title}`,
    );
    const data = await response.json();
    const preferredResult =
      data.results.sort(
        (
          a: { title?: string; name?: string; popularity: number },
          b: { title?: string; name?: string; popularity: number },
        ) => {
          const aTitle = a.title || a.name;
          const bTitle = b.title || b.name;
          if (aTitle === title && bTitle !== title) return -1;
          if (aTitle !== title && bTitle === title) return 1;
          if (aTitle === title && bTitle === title) return b.popularity - a.popularity;
          return b.popularity - a.popularity;
        },
      )[0] || data.results[0];

    if (!preferredResult) {
      return response;
    }

    const { id, media_type } = preferredResult;

    const userLanguage = preferredLanguage === Language.HU ? 'hu-HU' : 'en-US';
    const localizedResponse = await fetch(
      `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}&language=${userLanguage}&append_to_response=external_ids`,
    );
    const localizedData = await localizedResponse.json();
    return { ...localizedData, media_type };
  }
}
