import { MovieCategory, SeriesCategory, type TorrentCategory } from '../ncore/constants';
import { Language } from '@/schemas/language.schema';

export const HUNGARIAN_CATEGORIES: TorrentCategory[] = [
	MovieCategory.SD_HUN,
	MovieCategory.DVD_HUN,
	MovieCategory.DVD9_HUN,
	MovieCategory.HD_HUN,
	SeriesCategory.SD_HUN,
	SeriesCategory.DVD_HUN,
	SeriesCategory.HD_HUN,
];

export const languageEmojiMap: Record<Language, string> = {
	[Language.HU]: '🇭🇺',
	[Language.EN]: '🇬🇧',
};
