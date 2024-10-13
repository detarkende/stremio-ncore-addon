import { Redirect, Route, Switch } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LoginPage } from '@/pages/login';
import { AccountPage } from './pages/account';
import { TorrentsPage } from './pages/torrents';
import { useJwtStore } from './stores/jwt';

export const App = () => {
  const { jwt } = useJwtStore();

  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <div className="dark:bg-neutral-950 bg-neutral-100 dark:text-white h-full">
        <Switch>
          <Route path="/">{jwt ? <Redirect to="/account" /> : <Redirect to="/login" />}</Route>
          <Route path="/login">
            <LoginPage />
          </Route>
          <Route path="/configure">
            <Redirect to="/login" />
          </Route>
          <Route path="/account">
            <AccountPage />
          </Route>
          <Route path="/torrents">
            <TorrentsPage />
          </Route>
        </Switch>
      </div>
    </ThemeProvider>
  );
};
