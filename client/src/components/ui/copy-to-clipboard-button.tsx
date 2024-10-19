import { Button } from './button';
import { Check, Clipboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useState } from 'react';

interface CopyToClipboardButtonProps {
  text: string;
  duration?: number;
}

export const CopyToClipboardButton = ({ text, duration = 2000 }: CopyToClipboardButtonProps) => {
  const [open, setOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setOpen(true);
    setTimeout(() => setOpen(false), duration);
  };

  return (
    <TooltipProvider>
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="size-10 px-[14px]"
            type="button"
            onClick={copyToClipboard}
          >
            <Clipboard size={12} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="flex gap-x-2 items-center">
            <Check size={12} className="text-green-600" strokeWidth={4} />
            <span>Copied to clipboard</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
