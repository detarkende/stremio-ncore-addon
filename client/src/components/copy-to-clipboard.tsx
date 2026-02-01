import { Button, Tooltip, type TooltipProps } from '@heroui/react';
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

const tooltipPropsMap: Record<ButtonState, TooltipProps> = {
  [ButtonState.DEFAULT]: { content: 'Copy to clipboard', isOpen: undefined },
  [ButtonState.COPIED]: { content: 'Copied!', isOpen: true, color: 'success' },
  [ButtonState.FAILED]: { content: 'Failed to copy', isOpen: true, color: 'danger' },
};

export function CopyToClipboard({ text }: { text: string }) {
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
    <Tooltip {...tooltipPropsMap[buttonState]}>
      <Button
        size="sm"
        className="h-6"
        onPress={handleCopy}
        isIconOnly
        aria-label="Copy to clipboard"
        variant="light"
      >
        <Icon size={16} />
      </Button>
    </Tooltip>
  );
}
