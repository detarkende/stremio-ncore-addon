import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react';
import { UserRole } from '@sna/server';
import { useLocation } from '@tanstack/react-router';
import { Fragment, useState } from 'react';

import { Link } from '@/components/link';
import type { FileRouteTypes } from '@/routeTree.gen';

import { LogoutButton } from './logout-button';
import { Text } from './text';

interface NavbarItem {
  label: string;
  href: FileRouteTypes['to'];
}

const genericNavbarItems: NavbarItem[] = [
  { label: 'Account', href: '/account' },
  { label: 'Settings', href: '/settings' },
];
const adminNavbarItems: NavbarItem[] = [
  ...genericNavbarItems,
  { label: 'Torrents', href: '/torrents' },
];

export function Header({ userRole }: { userRole: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userRole === UserRole.ADMIN;

  const navbarItems = isAdmin ? adminNavbarItems : genericNavbarItems;

  const onLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Navbar
      isMenuOpen={isOpen}
      onMenuOpenChange={setIsOpen}
      maxWidth="xl"
      position="sticky"
      className="bg-default-50"
    >
      <NavbarBrand>
        <Text as="span" className="text-xl font-bold">
          SNA
        </Text>
      </NavbarBrand>
      <NavbarContent justify="end" className="hidden sm:flex">
        {navbarItems.map((item) => (
          <HeaderLink
            key={item.href}
            href={item.href}
            label={item.label}
            onClick={onLinkClick}
          />
        ))}
        <NavbarItem>
          <LogoutButton />
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end" className="sm:hidden">
        <NavbarMenuToggle />
        <NavbarMenu className="bg-default-50">
          {navbarItems.map((item) => (
            <HeaderLink
              key={item.href}
              href={item.href}
              label={item.label}
              onClick={onLinkClick}
              isMobile
            />
          ))}
          <NavbarMenuItem className="text-right">
            <LogoutButton />
          </NavbarMenuItem>
        </NavbarMenu>
      </NavbarContent>
    </Navbar>
  );
}

function HeaderLink({
  href,
  label,
  onClick,
  isMobile = false,
}: {
  href: FileRouteTypes['to'];
  label: string;
  onClick: () => void;
  isMobile?: boolean;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === href;
  const Wrapper = isMobile ? NavbarMenuItem : Fragment;
  return (
    <Wrapper isActive={isActive}>
      <NavbarItem isActive={isActive} className="text-right sm:text-left">
        <Link
          to={href}
          size="lg"
          onClick={onClick}
          className={isMobile ? '' : 'hover:underline underline-offset-3'}
        >
          {label}
        </Link>
      </NavbarItem>
    </Wrapper>
  );
}
