import type { PropsWithChildren } from 'react';
import { Header } from './header';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr]">
      <Header />
      <main className="container h-full py-2">{children}</main>
    </div>
  );
}
