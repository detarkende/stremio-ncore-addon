import { JSDOM } from 'jsdom';
import { login } from './login';
import { config } from '@/common/config/config';

export const getDownloadUrlFromNcoreId = async (ncoreId: string) => {
	const cookies = await login(config.NCORE_USERNAME, config.NCORE_PASSWORD);
	const response = await fetch(`${config.NCORE_URL}/torrents.php?action=details&id=${ncoreId}`, {
		headers: {
			cookie: cookies,
		},
	});
	const html = await response.text();
	const { document } = new JSDOM(html).window;
	const downloadLink = `${config.NCORE_URL}/${document
		.querySelector('.download > a')
		?.getAttribute('href')}`;
	return downloadLink;
};
