import { useId } from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Link } from './link';
import { Text } from './text';
import { CopyToClipboard } from './copy-to-clipboard';
import type { LucideIcon } from '@/types/icons';

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
  return (
    <div className="flex flex-col gap-1">
      <Text
        as="p"
        variant="body-sm"
        className="text-default-500 flex items-center gap-2"
        id={labelId}
      >
        {Icon && <Icon size={12} className="ml-1" />} {label}
      </Text>
      <div className="w-full flex items-center gap-2 bg-default-200 p-2 rounded-lg">
        <Tooltip content={<code className="break-all">{url}</code>} placement="top">
          <code
            aria-labelledby={labelId}
            className="w-full text-nowrap overflow-hidden text-ellipsis"
          >
            {url}
          </code>
        </Tooltip>
        <CopyToClipboard text={url} />
      </div>

      <div className="flex gap-4">
        <Button
          as={Link}
          color="primary"
          variant="flat"
          size="sm"
          showAnchorIcon
          to={addOnWebUrl}
          target="_blank"
        >
          Add to Stremio on Web
        </Button>
        <Button as={Link} color="primary" variant="flat" size="sm" to={addInAppUrl}>
          Add to Stremio in App
        </Button>
      </div>
    </div>
  );
}
