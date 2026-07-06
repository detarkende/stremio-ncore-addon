import '@client/styles.css';
import * as HeroUiProvider from '@client/integrations/heroui/root-provider';
import * as TanStackQueryProvider from '@client/integrations/tanstack-query/root-provider';
import { render as testRender } from 'vitest-browser-react';

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

export function render(component: React.ReactElement) {
  return testRender(
    <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
      <HeroUiProvider.Provider>{component}</HeroUiProvider.Provider>
    </TanStackQueryProvider.Provider>,
  );
}
