import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react';
import { InfoIcon, type LucideProps } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface InfoTooltipProps extends PropsWithChildren {
  tooltipProps?: ComponentPropsWithoutRef<typeof Tooltip>;
  tooltipContentProps?: ComponentPropsWithoutRef<typeof TooltipContent>;
  tooltipTriggerProps?: ComponentPropsWithoutRef<typeof TooltipTrigger>;
  iconProps?: LucideProps;
}

export const InfoTooltip = ({
  children,
  iconProps = {
    className: 'size-4',
  },
  tooltipProps = {
    delayDuration: 0,
  },
  tooltipContentProps = {
    className: 'max-w-[20rem]',
  },
  tooltipTriggerProps = {
    className: 'mx-1',
  },
}: InfoTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...tooltipProps}>
        <TooltipTrigger {...tooltipTriggerProps}>
          <InfoIcon {...iconProps} />
        </TooltipTrigger>
        <TooltipContent {...tooltipContentProps}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
