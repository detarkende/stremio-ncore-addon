export {
  type NcoreTorrent,
  NcoreOrderBy,
  NcoreOrderDirection,
  NcoreSearchBy,
} from './ncore.types';
import { NcoreService } from './ncore.service';
export {
  MovieCategory,
  SeriesCategory,
  NcoreResolution,
  type TorrentCategory,
  MOVIE_CATEGORY_FILTERS,
  SERIES_CATEGORY_FILTERS,
} from './ncore.constants';

export const ncoreService = new NcoreService();
