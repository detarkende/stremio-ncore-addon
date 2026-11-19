import { Text } from '@client/components/text';
import { configQueryOptions } from '@client/integrations/tanstack-query/queries/config';
import { Button, Spinner } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { ConfigSettingsForm } from './config-settings-form';

function Wrapper({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col gap-4">
      <Text as="h2" variant="heading-sm">
        <span>⚙️</span> Configuration Settings
      </Text>
      {children}
    </div>
  );
}

export function ConfigSettings() {
  const query = useQuery(configQueryOptions);
  if (query.isPending) {
    return (
      <Wrapper>
        <div className="bg-surface-secondary rounded-xl flex items-center justify-center w-full h-58">
          <Spinner size="lg" />
        </div>
      </Wrapper>
    );
  }
  if (query.error) {
    return (
      <Wrapper>
        <div className="bg-danger-soft rounded-xl flex flex-col items-center justify-center gap-4 w-full h-58">
          <Text as="p" variant="body-lg" className="text-danger">
            Failed to load configuration.
          </Text>
          {query.error && (
            <Text variant="body-sm" as="pre" className="mt-2 text-danger">
              {(query.error as Error).message}
            </Text>
          )}
          <Button variant="danger-soft" onPress={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </Wrapper>
    );
  }
  return (
    <Wrapper>
      <ConfigSettingsForm config={query.data} />
    </Wrapper>
  );
}
