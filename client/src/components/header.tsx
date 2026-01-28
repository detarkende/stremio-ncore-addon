import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react';
import { Fragment, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { UserRole } from '@sna/server';
import { Text } from './text';
import { Link } from '@/components/link';
import type { FileRouteTypes } from '@/routeTree.gen';

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
      className="container"
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
      </NavbarContent>
      <NavbarContent justify="end" className="sm:hidden">
        <NavbarMenuToggle />
        <NavbarMenu>
          {navbarItems.map((item) => (
            <HeaderLink
              key={item.href}
              href={item.href}
              label={item.label}
              onClick={onLinkClick}
              isMobile
            />
          ))}
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
      <NavbarItem isActive={isActive}>
        <Link to={href} size="lg" onClick={onClick}>
          {label}
        </Link>
      </NavbarItem>
    </Wrapper>
  );
}
