import { JSDOM } from 'jsdom';
import { login } from '../login';
import { downloadAndParseTorrent } from '../downloadAndParseTorrent';
import { getDownloadUrlFromNcoreId } from '../getDownloadUrlFromNcoreId';
import { config } from '@/common/config/config';

export const findDeletableInfoHashes = async (): Promise<string[]> => {
	const cookie = await login(config().ncore);
	const request = await fetch(`${config().ncore.url}/hitnrun.php?showall=true`, {
		headers: { cookie },
	});
	const html = await request.text();
	const { document } = new JSDOM(html).window;

	const rows = Array.from(document.querySelectorAll('.hnr_all, .hnr_all2'));
	const deletableRows = rows.filter(
		(row) => row.querySelector('.hnr_ttimespent')?.textContent === '-',
	);

	const deletableInfoHashPromises: Promise<string>[] = deletableRows.map(async (row) => {
		const detailsUrl = row.querySelector('.hnr_tname a')?.getAttribute('href') ?? '';
		const searchParams = new URLSearchParams(detailsUrl.split('?')[1] ?? '');
		const ncoreId = searchParams.get('id') ?? '';
		const downloadUrl = await getDownloadUrlFromNcoreId(ncoreId);
		const { infoHash } = await downloadAndParseTorrent(downloadUrl);
		return infoHash;
	});

	const deletableInfoHashes = (await Promise.allSettled(deletableInfoHashPromises))
		.filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
		.map((result) => result.value);
	return deletableInfoHashes;
};
