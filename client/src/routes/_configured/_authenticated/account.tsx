import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { meQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { Text } from '@/components/text';
import { CopyToClipboard } from '@/components/copy-to-clipboard';

export const Route = createFileRoute('/_configured/_authenticated/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  return (
    <div className="min-h-full flex justify-center">
      <div className="max-w-lg w-full">
        <Card>
          <CardHeader className="py-3">
            <Text as="h2" variant="heading-lg">
              Welcome, {me.username}!
            </Text>
          </CardHeader>
          <Divider />
          <CardBody className="py-6 flex flex-col gap-2">
            <Text as="p">Your addon URL</Text>
            <div className="w-full flex items-start gap-2">
              <code className="w-full">{}</code>
              <CopyToClipboard text={me.token} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
