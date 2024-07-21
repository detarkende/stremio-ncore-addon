import cookieParser from 'set-cookie-parser';
import { config } from '@/common/config/config';

const memoData = {
	pass: null as string | null,
	cookieExpirationDate: 0,
};

export const login = async ({
	username,
	password,
}: {
	username: string;
	password: string;
}): Promise<string> => {
	if (memoData.pass && memoData.cookieExpirationDate > Date.now() + 1000) {
		return memoData.pass;
	}
	const form = new FormData();
	form.append('set_lang', 'hu');
	form.append('submitted', '1');
	form.append('nev', username);
	form.append('pass', password);
	form.append('ne_leptessen_ki', '1');
	const resp = await fetch(`${config().ncore.url}/login.php`, {
		method: 'POST',
		body: form,
		redirect: 'manual',
	});
	const allCookies = cookieParser.parse(resp.headers.getSetCookie());
	const passCookie = allCookies.find(({ name }) => name === 'pass');

	if (!passCookie || passCookie.value === 'deleted') {
		throw new Error('Failed to log in to nCore. No pass cookie found');
	}
	const fullCookieString = allCookies.map(({ name, value }) => `${name}=${value}`).join('; ');
	memoData.pass = fullCookieString;
	if (passCookie.expires) {
		memoData.cookieExpirationDate = passCookie.expires.getTime();
	}

	return fullCookieString;
};
