export enum FlixPatrolPlatform {
  RTL = 'rtl-plus',
  HBO = 'hbo',
  NETFLIX = 'netflix',
  DISNEY = 'disney',
  AMAZON = 'amazon-prime',
  APPLE = 'apple-tv',
}

export enum FlixPatrolCategory {
  Overall = 'Overall',
  Shows = 'TV Shows',
  Movies = 'Movies',
}

export const categoryMapping: Record<string, FlixPatrolCategory> = {
  [`movie-${FlixPatrolPlatform.NETFLIX}`]: FlixPatrolCategory.Movies,
  [`series-${FlixPatrolPlatform.NETFLIX}`]: FlixPatrolCategory.Shows,
  [`movie-${FlixPatrolPlatform.HBO}`]: FlixPatrolCategory.Movies,
  [`series-${FlixPatrolPlatform.HBO}`]: FlixPatrolCategory.Shows,
  [`collections-${FlixPatrolPlatform.DISNEY}`]: FlixPatrolCategory.Overall,
  [`movie-${FlixPatrolPlatform.AMAZON}`]: FlixPatrolCategory.Movies,
  [`series-${FlixPatrolPlatform.AMAZON}`]: FlixPatrolCategory.Shows,
  [`movie-${FlixPatrolPlatform.APPLE}`]: FlixPatrolCategory.Movies,
  [`series-${FlixPatrolPlatform.APPLE}`]: FlixPatrolCategory.Shows,
  [`collections-${FlixPatrolPlatform.RTL}`]: FlixPatrolCategory.Overall,
};
