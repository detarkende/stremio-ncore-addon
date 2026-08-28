import { Text } from '@client/components/text';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import type { DeleteUnnecessaryTorrentsResponse } from '@server/exports';

export function DeletionResultsModal({
  result,
  onClose,
}: {
  result: DeleteUnnecessaryTorrentsResponse | null;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={result !== null}
      scrollBehavior="inside"
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      size="xl"
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>Deletion results</ModalHeader>
            <ModalBody>
              {result && (
                <>
                  <Text as="p">
                    {result.deleted.length} torrents successfully deleted,{' '}
                    {result.failed.length} deletions failed.
                  </Text>
                  <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-3">
                    {result.failed.map(({ torrent, error }) => (
                      <Alert
                        key={torrent.infoHash}
                        title="Failed to delete torrent"
                        color="danger"
                        variant="faded"
                        isClosable={false}
                      >
                        <div>
                          <Text as="p" variant="caption">
                            <span className="font-bold">Name:</span> {torrent.name}
                          </Text>
                          <Text as="p" variant="caption">
                            <span className="font-bold">Error:</span>{' '}
                            <span className="font-mono">{error.message}</span>
                          </Text>
                        </div>
                      </Alert>
                    ))}
                    {result.deleted.map((torrent) => (
                      <Alert
                        key={torrent.infoHash}
                        title="Successfully deleted torrent"
                        color="success"
                        variant="faded"
                        isClosable={false}
                      >
                        <div>
                          <Text as="p" variant="caption">
                            <span className="font-bold">Name:</span> {torrent.name}
                          </Text>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={closeModal}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
