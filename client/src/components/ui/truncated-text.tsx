import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useRef, useState } from 'react';

interface TruncatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string;
}

export const TruncatedText = ({ children, className = '', ...props }: TruncatedTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([element]) => {
      const overflowing = element.target.scrollWidth > element.target.clientWidth;
      setIsOverflowing((prev) => {
        if (prev && !overflowing) {
          setIsTooltipOpen(false);
        }
        return overflowing;
      });
    });
    resizeObserver.observe(ref.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={isOverflowing && isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            {...props}
            data-is-overflowing={isOverflowing}
            className={cn('whitespace-nowrap overflow-hidden overflow-ellipsis', className)}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
