vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/account' }),
}));

vi.mock('@client/components/link', () => ({
  Link: (props: React.ComponentProps<'a'>) => <a {...props} />,
}));

vi.mock('./logout-button', () => ({
  LogoutButton: () => <button>Logout</button>,
}));

import { render } from '@client/test-utils/render';
import { UserRole } from '@server/exports';

import { Header } from './header';

describe('Header', () => {
  it('should render regular user navigation', async () => {
    const screen = await render(<Header userRole={UserRole.USER} />);

    expect(screen.getByText('Account')).toBeVisible();
    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByText('Logout')).toBeVisible();
  });

  it('should include torrent navigation for administrators', async () => {
    const screen = await render(<Header userRole={UserRole.ADMIN} />);

    expect(screen.getByText('Torrents').first()).toBeVisible();
  });
});
