import { Hono } from 'hono';
import { z } from 'zod';
import { Layout } from '../components/layout';
import { Button, LoginForm, LoginButton } from './configure.components';
import { getUserByCredentials, userToJwt } from '@/common/helpers/user';
import { config } from '@/common/config/config';

export const configureRouter = new Hono();

configureRouter.get('/', (c) => {
	return c.html(
		<Layout title="Configure">
			<LoginForm />
		</Layout>,
	);
});

const loginSchema = z.object({
	username: z.string({
		invalid_type_error: 'Username must be a string',
		required_error: 'Username is required',
	}),
	password: z.string({
		invalid_type_error: 'Password must be a string',
		required_error: 'Password is required',
	}),
});

configureRouter.post('/', async (c) => {
	const body = await c.req.parseBody();
	const parsedBody = loginSchema.safeParse(body);
	if (!parsedBody.success) {
		return c.html(<LoginButton message={parsedBody.error.message} messageType="error" />);
	}
	const user = await getUserByCredentials(parsedBody.data);
	if (!user) {
		return c.html(<LoginButton message="Incorrect credentials" messageType="error" />);
	}

	const token = await userToJwt(user);

	const authenticatedUrl = `${config.ADDON_URL}/auth/${token}/manifest.json`;

	return c.html(
		<>
			<Button
				href={authenticatedUrl.replace(/https?:\/\//gi, 'stremio://')}
				message={`Success! Click the "Configure" button to start ☝🏼`}
				messageType="success"
			>
				Configure
			</Button>
			<Button
				href={`https://web.stremio.com/#/addons?addon=${encodeURIComponent(
					authenticatedUrl,
				)}`}
				message={`Success! Click the "Configure" button to start ☝🏼`}
				messageType="success"
			>
				Configure on the web
			</Button>
			<code
				style={{
					backgroundColor: '#f4f4f4',
					border: '1px solid #aaa',
					borderRadius: '12px',
					padding: '10px',
					margin: '5px 0',
				}}
			>
				{`${config.ADDON_URL}/auth/${token}/manifest.json`}
			</code>
		</>,
	);
});
