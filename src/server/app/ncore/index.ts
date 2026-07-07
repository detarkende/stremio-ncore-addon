export {
  type NcoreTorrent,
  /* @lintignore */
  NcoreOrderBy,
  /* @lintignore */
  NcoreOrderDirection,
  /* @lintignore */
  NcoreSearchBy,
} from './ncore.types';
import { NcoreService } from './ncore.service';
export {
  MovieCategory,
  SeriesCategory,
  /* @lintignore */
  NcoreResolution,
  /* @lintignore */
  type TorrentCategory,
  /* @lintignore */
  MOVIE_CATEGORY_FILTERS,
  /* @lintignore */
  SERIES_CATEGORY_FILTERS,
} from './ncore.constants';

export const ncoreService = new NcoreService();
