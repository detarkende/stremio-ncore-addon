export const SUPPORTED_MEDIA_EXTENSIONS = [
	'mkv',
	'avi',
	'mp4',
	'wmv',
	'vp8',
	'mov',
	'mpg',
	'ts',
	'm3u8',
	'webm',
	'flac',
	'mp3',
	'wav',
	'wma',
	'aac',
	'ogg$',
];

export const isSupportedMedia = (path: string) => {
	const extension = path.split('.').pop();
	if (!extension) return false;
	return SUPPORTED_MEDIA_EXTENSIONS.includes(extension.toLocaleLowerCase());
};
