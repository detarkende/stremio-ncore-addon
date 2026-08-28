import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { DeletionResultsModal } from './deletion-results-modal';

export function DeleteUnnecessaryTorrents({
  isDisabled = false,
}: {
  isDisabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.torrents.unnecessary.$delete();
      if (!response.ok && response.status !== 500) {
        await handleHttpError(response);
      }
      return await response.json();
    },
  });

  const { onOpen, isOpen, onOpenChange, onClose } = useDisclosure({
    onClose: () => deleteMutation.reset(),
  });

  const deleteUnnecessaryTorrents = useCallback(async () => {
    try {
      const result = await deleteMutation.mutateAsync();
      if (result.failed.length === 0) {
        addToast({
          color: 'success',
          title: `Successfully deleted ${result.deleted.length} unnecessary torrents`,
        });
        onClose();
      }
    } catch (error) {
      addToast({
        color: 'danger',
        title: 'Failed to delete unnecessary torrents',
        description: (error as Error).message,
      });
    } finally {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.TORRENTS, QueryKeys.UNNECESSARY_TORRENTS],
      });
    }
  }, [onClose, queryClient, deleteMutation]);

  return (
    <>
      <Button
        color="danger"
        variant="flat"
        onPress={onOpen}
        isDisabled={isDisabled || deleteMutation.isPending}
      >
        Delete unnecessary torrents
      </Button>

      <Modal
        isOpen={isOpen}
        isDismissable={!deleteMutation.isPending}
        onOpenChange={onOpenChange}
        size="xl"
      >
        <ModalContent>
          <>
            <ModalHeader>Delete unnecessary torrents</ModalHeader>
            <ModalBody>
              <Text as="p">
                This will attempt to delete unnecessary torrents. This action cannot be
                undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={deleteUnnecessaryTorrents}
                isLoading={deleteMutation.isPending}
                isDisabled={deleteMutation.isPending}
              >
                Delete torrents
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>

      <DeletionResultsModal result={deleteMutation.data ?? null} onClose={onClose} />
    </>
  );
}
