import { Link } from '@client/components/link';
import { FileRouteTypes } from '@client/routeTree.gen';
import { UserRole } from '@server/exports';
import { useLocation } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { LogoutButton } from '../logout-button';
import { Text } from '../text';

import styles from './header.module.css';

interface NavigationItem {
  label: string;
  href: FileRouteTypes['to'];
}

const genericNavigationItems: NavigationItem[] = [
  { label: 'Account', href: '/account' },
  { label: 'Settings', href: '/settings' },
];
const adminNavigationItems: NavigationItem[] = [
  ...genericNavigationItems,
  { label: 'Torrents', href: '/torrents' },
];

export function Header({ userRole }: { userRole: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userRole === UserRole.ADMIN;

  const navigationItems = isAdmin ? adminNavigationItems : genericNavigationItems;

  return (
    <header className="sticky sm:relative top-0 z-100 border-b border-border bg-background/95 backdrop-blur">
      <div
        className={styles.headerContainer}
        // className="container flex min-h-16 items-center justify-between gap-4"
      >
        <div className={styles.logoContainer}>
          <Text as="span" className="text-xl font-bold!">
            SNA
          </Text>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-default sm:hidden"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav aria-label="Main navigation" className={styles.navLinks} data-open={isOpen}>
          <ul className={styles.navLinkList}>
            {navigationItems.map((item) => (
              <li key={item.href}>
                <HeaderLink
                  key={item.href}
                  item={item}
                  onClick={() => setIsOpen(false)}
                />
              </li>
            ))}
            <li>
              <LogoutButton />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ item, onClick }: { item: NavigationItem; onClick?: () => void }) {
  const { pathname } = useLocation();
  const isActive = pathname === item.href;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`${isActive ? 'text-foreground' : 'text-muted'} hover:underline underline-offset-3`}
    >
      {item.label}
    </Link>
  );
}
