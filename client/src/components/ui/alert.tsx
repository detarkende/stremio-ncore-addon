import * as React from 'react';
import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { AlertCircle, type LucideProps } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border border-slate-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 dark:border-slate-800 dark:[&>svg]:text-slate-50',
  {
    variants: {
      variant: {
        default: 'bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50',
        error:
          'border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900',
        success:
          'border-green-600/50 text-green-600 dark:border-green-600 [&>svg]:text-green-600 dark:border-green-950/50 dark:text-green-950 dark:dark:border-green-950 dark:[&>svg]:text-green-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  title: React.ReactNode;
  description: React.ReactNode;
  iconProps?: LucideProps;
  titleProps?: ComponentProps<typeof AlertTitle>;
  descriptionProps?: ComponentProps<typeof AlertDescription>;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant,
      title,
      description,
      iconProps = { className: 'size-5' },
      titleProps = {},
      descriptionProps = {},
      ...props
    },
    ref,
  ) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <AlertCircle {...iconProps} />
      <AlertTitle {...titleProps}>{title}</AlertTitle>
      <AlertDescription {...descriptionProps}>{description}</AlertDescription>
    </div>
  ),
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert };
