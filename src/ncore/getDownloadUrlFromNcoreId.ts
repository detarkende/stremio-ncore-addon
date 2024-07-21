import { JSDOM } from 'jsdom';
import { login } from './login';
import { config } from '@/common/config/config';

export const getDownloadUrlFromNcoreId = async (ncoreId: string) => {
	const cookies = await login(config().ncore);
	const response = await fetch(
		`${config().ncore.url}/torrents.php?action=details&id=${ncoreId}`,
		{
			headers: {
				cookie: cookies,
			},
		},
	);
	const html = await response.text();
	const { document } = new JSDOM(html).window;
	const downloadLink = `${config().ncore.url}/${document
		.querySelector('.download > a')
		?.getAttribute('href')}`;
	return downloadLink;
};
