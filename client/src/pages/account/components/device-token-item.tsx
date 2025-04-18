import { CircleHelpIcon, ExternalLink, TrashIcon } from 'lucide-react';
import { DeviceToken } from '@server/db/schema/device-tokens';
import { STREMIO_WEB_URL } from '../constants';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { TruncatedText } from '@/components/ui/truncated-text';
import { CopyToClipboardButton } from '@/components/ui/copy-to-clipboard-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useConfig } from '@/hooks/use-config';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const DeviceTokenItem = ({
  deviceToken,
  onDelete,
}: {
  deviceToken: DeviceToken;
  onDelete: (token: DeviceToken) => void;
}) => {
  const { config } = useConfig();
  const manifestUrl = api.auth[':deviceToken']['manifest.json'].$url({
    param: { deviceToken: deviceToken.token },
  });

  if (!config) {
    return <LoadingSpinner />;
  }

  const addonManifestUrl = manifestUrl
    .toString()
    .replace(manifestUrl.origin, config.addonUrl);
  const stremioUrl = addonManifestUrl.replace(/https?/, 'stremio');

  const addOnWebUrl = `${STREMIO_WEB_URL}/#/addons?addon=${encodeURIComponent(addonManifestUrl)}`;
  return (
    <div className="space-y-8">
      <div className="flex gap-x-4 gap-y-2 justify-center items-center flex-wrap">
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <a href={stremioUrl} target="_blank" rel="noreferrer">
            Add in the Stremio app
          </a>
        </Button>
        <Button
          asChild
          className="bg-green-600 hover:bg-green-700 flex items-center gap-x-1"
        >
          <a href={addOnWebUrl} target="_blank" rel="noreferrer">
            <span>Add on the Web</span>
            <ExternalLink size={16} />
          </a>
        </Button>
      </div>
      <Collapsible className="space-y-3">
        <div className="flex items-start gap-6">
          <button
            className="flex items-center gap-2 text-red-600 focus-visible:underline hover:underline"
            onClick={() => onDelete(deviceToken)}
          >
            <TrashIcon className="size-3" />
            <span>Delete</span>
          </button>
          <CollapsibleTrigger className="focus-visible:underline hover:underline">
            <CircleHelpIcon size={16} className="inline-block mr-1 align-text-bottom" />
            Click here for help
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-1 py-2">
          <p className="text-gray-600">Add the following URL as an addon in stremio.</p>
          <p className="px-3 bg-gray-200 rounded-sm text-gray-800 flex justify-between items-center gap-x-1 font-mono">
            <TruncatedText className="py-2">{addonManifestUrl}</TruncatedText>
            <CopyToClipboardButton text={addonManifestUrl} />
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
