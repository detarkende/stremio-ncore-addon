import { Hono } from 'hono';
import { StatsSection, StatsTable } from './admin.components';
import { Layout } from '@/addon/components/layout';
import { store } from '@/torrent/store/index';
import { userSchema } from '@/common/config/config.schema';

export const adminRouter = new Hono();

adminRouter.get('/', (c) => {
	return c.html(
		<Layout title="Admin">
			<StatsSection />
		</Layout>,
	);
});

adminRouter.delete('/torrents/:infoHash', async (c) => {
	const { infoHash } = c.req.param();
	await store.deleteTorrent(infoHash);
	c.status(200);
	return c.body(null);
});

adminRouter.get('/stats', (c) => {
	return c.html(<StatsTable stats={store.getStoreStats()} />);
});

adminRouter.post('/users', async (c) => {
	const body = await c.req.parseBody();
	const parseResults = userSchema.safeParse(body);
	if (!parseResults.success) {
		return c.json({ error: parseResults.error.message }, 400);
	}
	// const user = parseResults.data;
	// TODO: check if user already exists
	// TODO: add user to config, then refresh config
});
