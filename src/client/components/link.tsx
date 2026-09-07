import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(
  (props, ref) => <a {...props} ref={ref} />,
);

RouterLink.displayName = 'RouterLink';

export const Link = createLink(RouterLink);
