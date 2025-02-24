import axios from 'axios';
import { JSDOM } from 'jsdom';
import {
  FlixPatrolPlatform,
  JustWatchPlatform,
  Platform,
  platformInfo,
} from './constants';
import { Cached, DEFAULT_MAX } from '@/utils/cache';
import { Language } from '@/db/schema/users';
import { StreamType } from '@/schemas/stream.schema';
import { TmdbService } from '@/services/catalog/tmdb.service';
import { SimpleMetadata } from '@/services/metadata';
import { JustWatchEdge, JustWatchResponse } from '@/services/catalog/types';

export class CatalogService {
  constructor(private tmdbService: TmdbService) {}

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
  public async getTrendingListByPlatform(
    preferredLanguage: Language,
    platform: Platform,
    type: string,
    skip: number | undefined,
  ): Promise<SimpleMetadata[]> {
    const jPlatformId = platformInfo.find((p) => p.name === platform)?.justWatchId;
    const fPlatformId = platformInfo.find((p) => p.name === platform)?.flixPatrolId;

    let recommendedTitles: { title: string; imdb_id: string | null }[] = [];
    if (jPlatformId) {
      recommendedTitles = await this.fetchRecommended(jPlatformId, type, skip);
    }
    if (fPlatformId) {
      recommendedTitles = await this.fetchTop10(fPlatformId);
    }
    const results: SimpleMetadata[] = [];
    for (const { title, imdb_id } of recommendedTitles) {
      const tmdbData = imdb_id
        ? await this.tmdbService.findSimpleMetadataByImdbId(imdb_id, preferredLanguage)
        : await this.tmdbService.searchTMDb(title, preferredLanguage);
      if (tmdbData) {
        results.push(tmdbData);
      }
    }

    return results.filter(
      (item: SimpleMetadata) =>
        item.description &&
        item.description !== '' &&
        (preferredLanguage !== Language.HU ||
          /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(item.description)),
    );
  }

  public async getRecommendationsByWatchHistory(
    preferredLanguage: Language,
    watchedImdbIds: string[],
  ): Promise<SimpleMetadata[]> {
    const results: SimpleMetadata[] = [];
    for (const imdb_id of watchedImdbIds) {
      const recommendations = await this.tmdbService.findRecommendedByImdbId(
        imdb_id,
        preferredLanguage,
      );
      if (recommendations) {
        results.push(...recommendations);
      }
    }
    return results;
  }

  private async fetchTop10(
    platform: FlixPatrolPlatform,
  ): Promise<{ title: string; imdb_id: string | null }[]> {
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

    const titles: { title: string; imdb_id: string | null }[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeValue) {
        titles.push({ title: node.nodeValue.trim(), imdb_id: null });
      }
    }
    return titles;
  }

  private async fetchRecommended(
    platform: JustWatchPlatform,
    type: string,
    skip: number | undefined,
  ): Promise<{ title: string; imdb_id: string | null }[]> {
    console.log(`Fetching JustWatch with: ${platform}, type: ${type}`);

    let res: JustWatchResponse | null = null;
    try {
      res = await axios.post('https://apis.justwatch.com/graphql', {
        operationName: 'GetPopularTitles',
        variables: {
          popularTitlesSortBy: 'POPULAR',
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
    return (res?.data?.data?.popularTitles?.edges || []).map((edge: JustWatchEdge) => ({
      title: edge.node?.content?.title ?? 'Unknown',
      imdb_id: edge.node?.content?.externalIds?.imdbId ?? null,
    }));
  }
}
