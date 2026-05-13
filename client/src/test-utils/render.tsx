import '@/styles.css';
import { render as testRender } from 'vitest-browser-react';

import * as HeroUiProvider from '@/integrations/heroui/root-provider';
import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider';

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

export function render(component: React.ReactElement) {
  return testRender(
    <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
      <HeroUiProvider.Provider>{component}</HeroUiProvider.Provider>
    </TanStackQueryProvider.Provider>,
  );
}
