import { Text } from '@client/components/text';
import { Alert, Button, Modal } from '@heroui/react';
import type { DeleteUnnecessaryTorrentsResponse } from '@server/exports';

export function DeletionResultsModal({
  result,
  onClose,
}: {
  result: DeleteUnnecessaryTorrentsResponse | null;
  onClose: () => void;
}) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={result !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Deletion results</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  {result && (
                    <>
                      <Text as="p">
                        {result.deleted.length} torrents successfully deleted,{' '}
                        {result.failed.length} deletions failed.
                      </Text>
                      <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-3">
                        {result.failed.map(({ torrent, error }) => (
                          <Alert key={torrent.infoHash} status="danger">
                            <Alert.Indicator />
                            <Alert.Content>
                              <Alert.Title>Failed to delete torrent</Alert.Title>
                              <Alert.Description>
                                <Text as="p" variant="caption">
                                  <span className="font-bold">Name:</span> {torrent.name}
                                </Text>
                                <Text as="p" variant="caption">
                                  <span className="font-bold">Error:</span>{' '}
                                  <span className="font-mono">{error.message}</span>
                                </Text>
                              </Alert.Description>
                            </Alert.Content>
                          </Alert>
                        ))}
                        {result.deleted.map((torrent) => (
                          <Alert key={torrent.infoHash} status="success">
                            <Alert.Indicator />
                            <Alert.Content>
                              <Alert.Title>Successfully deleted torrent</Alert.Title>
                              <Alert.Description>
                                <Text as="p" variant="caption">
                                  <span className="font-bold">Name:</span> {torrent.name}
                                </Text>
                              </Alert.Description>
                            </Alert.Content>
                          </Alert>
                        ))}
                      </div>
                    </>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button onPress={close}>Close</Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
