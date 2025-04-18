import { useQuery } from '@tanstack/react-query';
import { Alert } from '../ui/alert';
import { api } from '@/api';
import { Card } from '@/components/ui/card';
import { QueryKeys } from '@/constants/query-keys';

export const TorrentSourceIssues = () => {
  const { data, status, error, refetch } = useQuery({
    queryKey: [QueryKeys.TORRENT_SOURCE_ISSUES],
    retry: 0,
    queryFn: async () => {
      const request = await api.config['torrent-sources'].issues.$get();
      const response = await request.json();
      return response;
    },
  });

  switch (status) {
    case 'error':
      return (
        <Card className="p-4">
          <p className="font-bold">Failed to load torrent source statuses.</p>
          <code>{error.message}</code>
          <button className="block mt-2 underline" onClick={() => refetch()}>
            Retry
          </button>
        </Card>
      );
    case 'success':
      return (
        <ul className="space-y-4">
          {data.map((issue) => (
            <Alert
              key={issue.id}
              variant="error"
              title={issue.sourceName}
              description={issue.message}
            />
          ))}
        </ul>
      );
    case 'pending':
    default:
      return null;
  }
};
