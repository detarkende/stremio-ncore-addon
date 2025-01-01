import { ROUTES } from '@/constants/routes';
import { useMe } from '@/hooks/use-me';
import { Link } from 'wouter';
import styles from './navbar.module.scss';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { UserRole } from '@server/db/schema/users';

export const Navbar = () => {
  const navSidebarRef = useRef<HTMLUListElement>(null);
  const { data: user } = useMe();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  const closeNavbar = () => setIsNavbarOpen(false);

  useEffect(() => {
    const closeNavbarOnClickOutside = (event: MouseEvent) => {
      if (
        navSidebarRef.current &&
        !navSidebarRef.current.contains(event.target as Node)
      ) {
        closeNavbar();
      }
    };
    const closeNavbarOnResize = () => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        closeNavbar();
      }
    };
    window.addEventListener('resize', closeNavbarOnResize);
    window.addEventListener('pointerdown', closeNavbarOnClickOutside);

    return () => {
      window.removeEventListener('resize', closeNavbarOnResize);
      window.removeEventListener('pointerdown', closeNavbarOnClickOutside);
    };
  }, []);

  return (
    <header
      className={cn(styles.navbar, 'dark:bg-neutral-800 bg-neutral-300 dark:text-white')}
    >
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link to={ROUTES.ACCOUNT}>
            <h1 className="font-bold">SNA</h1>
          </Link>
          <div>
            <button
              aria-controls="navbar-links"
              aria-expanded={isNavbarOpen}
              className="md:hidden"
              onClick={() => setIsNavbarOpen((prev) => !prev)}
            >
              {isNavbarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
            <ul
              ref={navSidebarRef}
              id="navbar-links"
              className={styles.navLinks}
              data-state={isNavbarOpen ? 'open' : 'closed'}
            >
              <li>
                <Link onClick={closeNavbar} to={ROUTES.ACCOUNT}>
                  My account
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link onClick={closeNavbar} to={ROUTES.SETTINGS}>
                    Settings
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link onClick={closeNavbar} to={ROUTES.TORRENTS}>
                    Torrents
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};
