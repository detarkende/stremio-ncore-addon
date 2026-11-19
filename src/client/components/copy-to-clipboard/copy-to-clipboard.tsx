import { Button, Tooltip } from '@heroui/react';
import { CopyIcon, CopyXIcon, CopyCheckIcon } from 'lucide-react';
import { useState } from 'react';

const ButtonState = {
  DEFAULT: 'default',
  COPIED: 'copied',
  FAILED: 'error',
} as const;

type ButtonState = (typeof ButtonState)[keyof typeof ButtonState];

const iconMap = {
  [ButtonState.DEFAULT]: CopyIcon,
  [ButtonState.COPIED]: CopyCheckIcon,
  [ButtonState.FAILED]: CopyXIcon,
};

const tooltipStateMap: Record<ButtonState, { content: string; isOpen?: boolean }> = {
  [ButtonState.DEFAULT]: { content: 'Copy to clipboard' },
  [ButtonState.COPIED]: { content: 'Copied!', isOpen: true },
  [ButtonState.FAILED]: { content: 'Failed to copy', isOpen: true },
};

export function CopyToClipboard({ text }: { text: string }) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>(ButtonState.DEFAULT);

  const changeButtonState = (state: ButtonState) => {
    setButtonState(state);
    setTimeout(() => {
      setButtonState(ButtonState.DEFAULT);
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      changeButtonState(ButtonState.COPIED);
    } catch {
      changeButtonState(ButtonState.FAILED);
    }
  };
  const Icon = iconMap[buttonState];

  return (
    <Tooltip
      delay={500}
      isOpen={tooltipStateMap[buttonState].isOpen ?? isTooltipOpen}
      onOpenChange={(isOpen) => setIsTooltipOpen(isOpen)}
    >
      <Tooltip.Trigger aria-label="Copy tooltip">
        <Button
          size="sm"
          className="h-6"
          onPress={handleCopy}
          isIconOnly
          aria-label="Copy to clipboard"
          variant="tertiary"
        >
          <Icon size={16} data-testid={`icon-${buttonState}`} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{tooltipStateMap[buttonState].content}</Tooltip.Content>
    </Tooltip>
  );
}
