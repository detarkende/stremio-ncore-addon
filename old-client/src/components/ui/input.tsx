import * as React from 'react';

import { EyeIcon, EyeOffIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [passwordVisible, setPasswordVisible] = React.useState(false);
    const isPassword = type === 'password';

    const PasswordToggle = (props: LucideProps) =>
      passwordVisible ? <EyeOffIcon {...props} /> : <EyeIcon {...props} />;

    return (
      <div className="relative">
        <input
          type={isPassword ? (passwordVisible ? 'text' : 'password') : type}
          className={cn(
            `flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 ${isPassword ? 'pr-8' : ''} py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-950 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:file:text-slate-50 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300`,
            className,
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            className="absolute inset-y-0 right-3"
            onClick={() => setPasswordVisible((isVisible) => !isVisible)}
            type="button"
          >
            <PasswordToggle className="size-5" />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
