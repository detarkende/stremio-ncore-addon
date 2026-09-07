import type { LucideIcon } from '@client/types/icons';
import { Tooltip } from '@heroui/react';
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
          className="text-muted flex items-center gap-2"
          id={labelId}
        >
          {Icon && <Icon size={12} className="ml-1" />} {label}
        </Text>
        <div className="min-w-0 flex gap-1 items-center">
          <div className="min-w-0 w-full flex items-start gap-2 bg-surface-secondary px-3 py-2 rounded-xl">
            <Tooltip delay={500}>
              <Tooltip.Trigger className="min-w-0 flex-1">
                <code
                  onClick={toggleWrapUrl}
                  aria-labelledby={labelId}
                  className={`block min-w-0 w-full ${wrapUrl ? 'wrap-break-word' : 'text-nowrap'} overflow-hidden text-ellipsis`}
                >
                  {url}
                </code>
              </Tooltip.Trigger>
              <Tooltip.Content placement="top">
                <code className="break-all">{url}</code>
              </Tooltip.Content>
            </Tooltip>
            <CopyToClipboard text={url} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          className="button button--md button--secondary"
          href={addInAppUrl}
          target="_blank"
        >
          <span className="text-wrap">Stremio App</span>
        </a>
        <a
          className="button button--md button--primary"
          href={addOnWebUrl}
          target="_blank"
        >
          <span className="text-wrap">Stremio Web</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
