import type { FC } from 'hono/jsx';
import type { TorrentStoreStats } from '@/torrent/store/index';

export const StatsTable: FC<{ stats: TorrentStoreStats[] }> = ({ stats }) => {
	return (
		<table style={{ width: '100%' }}>
			<thead>
				<tr>
					<th>Infohash</th>
					<th>Name</th>
					<th>Progress</th>
					<th>Total size</th>
					<th>Downloaded</th>
					<th>Delete</th>
				</tr>
			</thead>
			<tbody hx-target="closest tr" hx-swap="outerHTML" hx-confirm="Are you sure?">
				{stats.map((stat) => (
					<tr key={stat.hash}>
						<td
							title={stat.hash}
							style={{ maxWidth: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
						>
							{stat.hash}
						</td>
						<td>
							<span
								title={stat.name}
								style={{
									wordWrap: 'anywhere',
									overflow: 'hidden',
									'-webkit-line-clamp': 2,
									display: '-webkit-box',
									'-webkit-box-orient': 'vertical',
								}}
							>
								{stat.name}
							</span>
						</td>
						<td style={{ whiteSpace: 'nowrap' }}>{stat.progress}</td>
						<td style={{ whiteSpace: 'nowrap' }}>{stat.size}</td>
						<td style={{ whiteSpace: 'nowrap' }}>{stat.downloaded}</td>
						<td>
							<button hx-delete={`./admin/torrents/${stat.hash}`}>Delete</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const StatsSection: FC = () => {
	return (
		<section style={{ maxWidth: '800px' }}>
			<h2>Stats</h2>
			<div hx-get="./admin/stats" hx-swap="innerHTML" hx-trigger="load, every 3s">
				<StatsTable stats={[]} />
			</div>
		</section>
	);
};
