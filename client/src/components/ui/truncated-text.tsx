import { cn } from '@/lib/utils';

interface TruncatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string;
}

export const TruncatedText = ({ children, className = '', ...props }: TruncatedTextProps) => {
  return (
    <div
      {...props}
      className={cn('whitespace-nowrap overflow-hidden overflow-ellipsis', className)}
    >
      {children}
    </div>
  );
};
