import { CopyToClipboard } from '@client/components/copy-to-clipboard';
import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { addToast, Button, Tooltip } from '@heroui/react';
import type { User } from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleQuestionMarkIcon, RotateCwIcon } from 'lucide-react';

export function Token({
  user,
  isMe,
  onClose,
}: {
  user: User;
  isMe: boolean;
  onClose: () => void;
}) {
  const labelId = `token-label-${user.id}`;
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.users[':userId'].token.$put({
        param: { userId: `${user.id}` },
      });
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });

  const rotateToken = async () => {
    if (
      confirm(
        'Are you sure you want to rotate the token? This will invalidate your current addon connection, so you will need to re-add the addon in Stremio on every device you use.',
      )
    ) {
      try {
        await mutateAsync();
        addToast({
          title: 'Token rotated',
          description: isMe
            ? 'Your token has been rotated. Please remove and re-add the addon in Stremio.'
            : `The token for user ${user.username} has been rotated.`,
          color: 'success',
        });
        await queryClient.invalidateQueries({ queryKey: [QueryKeys.USERS] });
        if (isMe) {
          await queryClient.invalidateQueries({ queryKey: [QueryKeys.ME] });
        }
        await queryClient.refetchQueries();
      } catch (error) {
        addToast({
          title: isMe
            ? 'Failed to rotate your token'
            : `Failed to rotate token for user "${user.username}"`,
          description: (error as Error).message,
          color: 'danger',
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Text
          as="p"
          variant="body-sm"
          className="text-default-500 flex items-center gap-2"
          id={labelId}
        >
          {user.username}&apos;s token
          <Tooltip
            content={
              <div className="max-w-80">
                <Text as="p" variant="body-sm">
                  This token is used to authenticate you with Stremio. Keep it secret and
                  do not share it with anyone.
                </Text>
                <Text as="p" variant="body-sm" className="text-danger">
                  Rotating the token will invalidate the current one and generate a new
                  token. You will need to remove and re-add the addon in Stremio after
                  rotating the token.
                </Text>
              </div>
            }
          >
            <CircleQuestionMarkIcon size={12} />
          </Tooltip>
        </Text>
        <div className="w-full flex items-center gap-2 bg-default-200 p-2 rounded-lg">
          <Tooltip
            content={<code className="break-all">{user.token}</code>}
            placement="top"
          >
            <code
              aria-labelledby={labelId}
              className="w-full text-nowrap overflow-hidden text-ellipsis"
            >
              {user.token}
            </code>
          </Tooltip>
          <CopyToClipboard text={user.token} />
        </div>
      </div>
      <div className="flex gap-4">
        <Button onPress={rotateToken} color="danger">
          <RotateCwIcon size={16} /> Rotate token
        </Button>
        <Button onPress={onClose}>Close</Button>
      </div>
    </div>
  );
}
