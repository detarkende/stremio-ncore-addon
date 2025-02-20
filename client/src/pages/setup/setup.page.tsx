import { useIsConfigured } from '@/hooks/use-is-configured';
import { SetupForm } from './components/setup-form';
import { Redirect } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants/query-keys';
import { api } from '@/api';

export const SetupPage = () => {
  const { isConfigured } = useIsConfigured();
  const { data } = useQuery({
    queryKey: [QueryKeys.LOCAL_URL],
    queryFn: async () => {
      const req = await api.config['local-url'].$get();
      return (await req.json()).localUrl;
    },
  });

  if (isConfigured === true) {
    return <Redirect to="/" />;
  }
  return (
    <div className="container pt-6 pb-24 min-h-full">
      <SetupForm localUrl={data} />
    </div>
  );
};
