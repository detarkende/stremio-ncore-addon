import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { GlobeIcon, NetworkIcon } from 'lucide-react';

import { AddonUrl } from '@/components/addon-url';
import { Text } from '@/components/text';
import { apiClient } from '@/integrations/api';
import { configQueryOptions } from '@/integrations/tanstack-query/queries/config';

export const Route = createFileRoute('/_configured/_authenticated/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const { me } = Route.useRouteContext();
  const { data: config } = useSuspenseQuery(configQueryOptions);

  const { localUrl, remoteUrl } = config;

  const manifestUrl = apiClient.api.auth[':token']['manifest.json'].$url({
    param: { token: me.token },
  });

  const localManifestUrl = manifestUrl.toString().replace(manifestUrl.origin, localUrl);
  const remoteManifestUrl = remoteUrl
    ? manifestUrl.toString().replace(manifestUrl.origin, remoteUrl)
    : null;

  return (
    <div className="flex justify-center pt-3">
      <div className="max-w-xl w-full">
        <div>
          <Text as="h2" variant="heading-lg">
            Welcome, {me.username}!
          </Text>
        </div>
        <div className="py-6 flex flex-col gap-8">
          <Text as="p">Your addon URL{remoteManifestUrl ? 's' : ''}:</Text>
          <AddonUrl icon={NetworkIcon} url={localManifestUrl} label="Local URL" />
          {remoteManifestUrl && (
            <AddonUrl icon={GlobeIcon} url={remoteManifestUrl} label="Remote URL" />
          )}
        </div>
      </div>
    </div>
  );
}
