import type { PropsWithChildren } from 'react';
import { ThemeProvider } from './theme-provider';
import { Navbar } from './navbar/navbar';

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Navbar />
      <main className="dark:bg-neutral-950 bg-neutral-100 dark:text-white min-h-full">
        <div className="container pt-6 pb-24 h-full">{children}</div>
      </main>
    </ThemeProvider>
  );
};
