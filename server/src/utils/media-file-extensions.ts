const SUPPORTED_MEDIA_REGEX =
  /.*\.(mkv|avi|mp4|wmv|vp8|mov|mpg|m3u8|webm|flac|mp3|wav|wma|aac|ogg)$/i;

export const isSupportedMedia = (path: string) => {
  return SUPPORTED_MEDIA_REGEX.test(path);
};
