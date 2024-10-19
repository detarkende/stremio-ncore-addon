import { api } from '@/api';
import { STREMIO_WEB_URL } from '../constants';
import { Button } from '@/components/ui/button';
import { TruncatedText } from '@/components/ui/truncated-text';
import { CopyToClipboardButton } from '@/components/ui/copy-to-clipboard-button';
import { ExternalLink } from 'lucide-react';

export const AddToStremio = ({ jwt }: { jwt: string }) => {
  const manifestUrl = api.api.auth[':jwt']['manifest.json'].$url({ param: { jwt } }).toString();
  const stremioUrl = (() => {
    const url = new URL(manifestUrl);
    url.protocol = 'stremio:';
    return url.toString();
  })();

  const addOnWebUrl = `${STREMIO_WEB_URL}/#/addons?addon=${encodeURIComponent(stremioUrl)}`;

  return (
    <div className="space-y-8">
      <div className="flex gap-x-4 gap-y-2 justify-center items-center flex-wrap">
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
          <a href={stremioUrl} target="_blank" rel="noreferrer">
            Add in the Stremio app
          </a>
        </Button>
        <Button
          asChild
          size="lg"
          className="bg-green-600 hover:bg-green-700 flex items-center gap-x-1"
        >
          <a href={addOnWebUrl} target="_blank" rel="noreferrer">
            <span>Add on the Web</span>
            <ExternalLink size={16} />
          </a>
        </Button>
      </div>
      <div>
        <p className="text-center">
          Alternatively, if the buttons fail, try adding the following URL:
        </p>
        <p className="px-4 bg-gray-800 rounded-md text-white flex justify-between items-center gap-x-1">
          <TruncatedText className="py-4">{manifestUrl}</TruncatedText>
          <CopyToClipboardButton text={manifestUrl} />
        </p>
      </div>
    </div>
  );
};
