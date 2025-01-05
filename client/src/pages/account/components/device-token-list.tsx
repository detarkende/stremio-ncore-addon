import { api } from '@/api';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState, type PropsWithChildren } from 'react';
import { CreateDeviceToken } from './create-device-token';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { DeviceTokenItem } from './device-token-item';
import { DeviceToken } from '@server/db/schema/device-tokens';
import { MutationKeys } from '@/constants/mutation-keys';
import { toast } from 'sonner';
import { handleError, HttpError } from '@/lib/errors';

const List = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-y-3">{children}</div>
);

export const DeviceTokenList = () => {
  const [openedDeviceToken, setOpenedDeviceToken] = useState('');
  const {
    data = [],
    isError,
    error,
    isLoading,
  } = useQuery({
    queryFn: async () => {
      const req = await api['device-tokens'].$get();
      return await req.json();
    },
    queryKey: ['device-tokens'],
  });

  const { mutateAsync: deleteDeviceToken } = useMutation({
    mutationFn: async (token: string) => {
      const req = await api['device-tokens'].$delete({ json: { token } });
      if (!req.ok) {
        throw new HttpError(req);
      }
      return await req.json();
    },
    onError: (e) => handleError(e, 'Failed to delete device token'),
    onSuccess: () => toast.success('Device token deleted successfully'),
    mutationKey: [MutationKeys.DELETE_DEVICE_TOKEN, openedDeviceToken],
  });

  const onDelete = useCallback(
    async ({ token, name }: DeviceToken) => {
      if (window.confirm(`Are you sure you want to delete this device token?\n${name}`)) {
        await deleteDeviceToken(token);
      }
    },
    [deleteDeviceToken],
  );

  if (isError) {
    return (
      <Alert
        variant="error"
        title="Failed to load device tokens"
        description={error.message}
      />
    );
  }
  if (isLoading) {
    <List>
      <Skeleton className="w-full rounded-md h-12" />
      <Skeleton className="w-full rounded-md h-12" />
      <Skeleton className="w-full rounded-md h-12" />
    </List>;
  }

  return (
    <div className="flex flex-col gap-y-3">
      {data.length === 0 ? (
        <p className="text-slate-900 dark:text-white">No device tokens found.</p>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="pt-2 pb-4"
          value={openedDeviceToken}
          onValueChange={setOpenedDeviceToken}
        >
          {data.map((token) => (
            <AccordionItem className="group" key={token.id} value={token.token}>
              <AccordionTrigger className="">{token.name}</AccordionTrigger>
              <AccordionContent className="py-4 space-y-4">
                <DeviceTokenItem deviceToken={token} onDelete={onDelete} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <CreateDeviceToken setOpenedDeviceToken={setOpenedDeviceToken} />
    </div>
  );
};
