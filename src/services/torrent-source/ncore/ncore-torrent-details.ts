import { TorrentDetails, type ParsedTorrentDetails, type TorrentFileDetails } from '../types';
import type { NcoreTorrent } from './types';
import type { TorrentCategory } from './constants';
import {
	HUNGARIAN_CATEGORIES,
	MovieCategory,
	NcoreResolution,
	ncoreResolutionLabels,
	SeriesCategory,
} from './constants';
import { Resolution } from '@/schemas/resolution.schema';
import { Language } from '@/schemas/language.schema';

export class NcoreTorrentDetails extends TorrentDetails {
	public sourceName: string;
	public sourceId: string;
	public infoHash: string;
	public fallbackResolution: Resolution;
	public files: TorrentFileDetails[];

	private category: TorrentCategory;
	private release_name: string;

	constructor(ncoreTorrent: NcoreTorrent, parsedDetails: ParsedTorrentDetails) {
		super();
		this.sourceName = 'ncore';
		this.sourceId = ncoreTorrent.torrent_id;
		this.infoHash = parsedDetails.infoHash;
		this.files = parsedDetails.files;
		this.fallbackResolution = ['xvid', 'xvid_hun', 'xvidser', 'xvidser_hun'].includes(
			ncoreTorrent.category,
		)
			? Resolution.R480P
			: Resolution.R720P;
		this.category = ncoreTorrent.category;
		this.release_name = ncoreTorrent.release_name;
	}

	public displayResolution(resolution: Resolution): string {
		return `${ncoreResolutionLabels[this.getNcoreResolutionByCategory(this.category)]} (${resolution})`;
	}

	public getName(): string {
		return this.release_name;
	}

	public getLanguage(): Language {
		return HUNGARIAN_CATEGORIES.includes(this.category) ? Language.HU : Language.EN;
	}

	private getNcoreResolutionByCategory = (category: TorrentCategory): NcoreResolution => {
		switch (category) {
			case MovieCategory.SD_HUN:
			case MovieCategory.SD:
				return NcoreResolution.SD;
			case MovieCategory.DVD_HUN:
			case MovieCategory.DVD:
				return NcoreResolution.DVD;
			case MovieCategory.DVD9_HUN:
			case MovieCategory.DVD9:
				return NcoreResolution.DVD9;
			case MovieCategory.HD_HUN:
			case MovieCategory.HD:
				return NcoreResolution.HD;
			case SeriesCategory.SD_HUN:
			case SeriesCategory.SD:
				return NcoreResolution.SD;
			case SeriesCategory.DVD_HUN:
			case SeriesCategory.DVD:
				return NcoreResolution.DVD;
			case SeriesCategory.HD_HUN:
			case SeriesCategory.HD:
				return NcoreResolution.HD;
		}
	};
}
