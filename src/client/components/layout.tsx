import type { UserRole } from '@server/exports';
import type { PropsWithChildren } from 'react';

import { Header } from './header/header';

interface LayoutProps extends PropsWithChildren {
  userRole: UserRole;
}

export function Layout({ children, userRole }: LayoutProps) {
  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <Header userRole={userRole} />
      <main className="container w-full h-full px-6 pt-2 pb-20">{children}</main>
    </div>
  );
}
