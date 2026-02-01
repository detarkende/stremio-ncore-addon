import type { PropsWithChildren } from 'react';
import type { UserRole } from '@sna/server';
import { Header } from './header';

interface LayoutProps extends PropsWithChildren {
  userRole: UserRole;
}

export function Layout({ children, userRole }: LayoutProps) {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr]">
      <div className="bg-default-50">
        <Header userRole={userRole} />
      </div>
      <main className="container max-w-screen h-full pt-2 pb-20">{children}</main>
    </div>
  );
}
