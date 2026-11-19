import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { Button, Modal, toast, useOverlayState } from '@heroui/react';
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

  const state = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        deleteMutation.reset();
      }
    },
  });

  const deleteUnnecessaryTorrents = useCallback(async () => {
    try {
      const result = await deleteMutation.mutateAsync();
      if (result.failed.length === 0) {
        toast.success(
          `Successfully deleted ${result.deleted.length} unnecessary torrents`,
        );
        state.close();
      }
    } catch (error) {
      toast.danger('Failed to delete unnecessary torrents', {
        description: (error as Error).message,
      });
    } finally {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.TORRENTS, QueryKeys.UNNECESSARY_TORRENTS],
      });
    }
  }, [queryClient, deleteMutation, state]);

  return (
    <>
      <Button
        variant="danger-soft"
        onPress={state.open}
        isDisabled={isDisabled || deleteMutation.isPending}
      >
        Delete unnecessary torrents
      </Button>

      <Modal>
        <Modal.Backdrop
          isOpen={state.isOpen}
          isDismissable={!deleteMutation.isPending}
          onOpenChange={state.setOpen}
        >
          <Modal.Container size="lg">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Delete unnecessary torrents</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Text as="p">
                  This will attempt to delete unnecessary torrents. This action cannot be
                  undone.
                </Text>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="tertiary"
                  onPress={state.close}
                  isDisabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={deleteUnnecessaryTorrents}
                  isPending={deleteMutation.isPending}
                  isDisabled={deleteMutation.isPending}
                >
                  Delete torrents
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <DeletionResultsModal result={deleteMutation.data ?? null} onClose={state.close} />
    </>
  );
}
