import type { BrowserCommand } from 'vitest/node';

export const allowClipboard: BrowserCommand = async (ctx) => {
  await ctx.context.grantPermissions(['clipboard-read', 'clipboard-write']);
};

declare module 'vitest/browser' {
  interface BrowserCommands {
    allowClipboard: () => Promise<void>;
  }
}
