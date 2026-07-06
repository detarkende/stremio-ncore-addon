import { HeroUIProvider, ToastProvider } from '@heroui/react';
import type { PropsWithChildren } from 'react';

export const Provider = ({ children }: PropsWithChildren) => {
  return (
    <HeroUIProvider className="min-h-full">
      <ToastProvider placement="top-right" toastOffset={64} />
      {children}
    </HeroUIProvider>
  );
};
