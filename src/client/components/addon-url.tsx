import type { LucideIcon } from '@client/types/icons';
import { Button, Tooltip } from '@heroui/react';
import { ExternalLink } from 'lucide-react';
import { useId, useState } from 'react';

import { CopyToClipboard } from './copy-to-clipboard/index';
import { Text } from './text/index';

export function AddonUrl({
  url,
  label,
  icon,
}: {
  url: string;
  label: string;
  icon?: LucideIcon;
}) {
  const labelId = useId();
  const Icon = icon;

  const addOnWebUrl = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(url)}`;
  const addInAppUrl = url.replace(/^https?:\/\//, 'stremio://');

  const [wrapUrl, setWrapUrl] = useState(false);
  const toggleWrapUrl = () => setWrapUrl((prev) => !prev);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Text
          as="p"
          variant="body-sm"
          className="text-default-500 flex items-center gap-2"
          id={labelId}
        >
          {Icon && <Icon size={12} className="ml-1" />} {label}
        </Text>
        <div className="flex gap-1 items-center">
          <div className="w-full flex items-start gap-2 bg-default-200 px-3 py-2 rounded-xl">
            <Tooltip
              delay={500}
              content={<code className="break-all">{url}</code>}
              placement="top"
            >
              <code
                onClick={toggleWrapUrl}
                aria-labelledby={labelId}
                className={`w-full ${wrapUrl ? 'wrap-break-word' : 'text-nowrap'} overflow-hidden text-ellipsis`}
              >
                {url}
              </code>
            </Tooltip>
            <CopyToClipboard text={url} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          as="a"
          color="secondary"
          variant="solid"
          size="md"
          href={addInAppUrl}
          target="_blank"
        >
          <span className="text-wrap">Stremio App</span>
        </Button>
        <Button
          as="a"
          color="primary"
          variant="solid"
          size="md"
          href={addOnWebUrl}
          target="_blank"
        >
          <span className="text-wrap">Stremio Web</span>
          <ExternalLink size={16} />
        </Button>
      </div>
    </div>
  );
}
