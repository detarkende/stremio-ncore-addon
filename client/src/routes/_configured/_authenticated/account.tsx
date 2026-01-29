import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { GlobeIcon, NetworkIcon } from 'lucide-react';
import { meQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { Text } from '@/components/text';
import { configQueryOptions } from '@/integrations/tanstack-query/queries/config';
import { apiClient } from '@/integrations/api';
import { AddonUrl } from '@/components/addon-url';

export const Route = createFileRoute('/_configured/_authenticated/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: me } = useSuspenseQuery(meQueryOptions);
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
    <div className="min-h-full flex justify-center">
      <div className="max-w-xl w-full">
        <Card>
          <CardHeader className="py-3">
            <Text as="h2" variant="heading-lg">
              Welcome, {me.username}!
            </Text>
          </CardHeader>
          <Divider />
          <CardBody className="py-6 flex flex-col gap-4">
            <Text as="p">Your addon URL{remoteManifestUrl ? 's' : ''}:</Text>
            <AddonUrl icon={NetworkIcon} url={localManifestUrl} label="Local URL" />
            {remoteManifestUrl && (
              <AddonUrl icon={GlobeIcon} url={remoteManifestUrl} label="Remote URL" />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
