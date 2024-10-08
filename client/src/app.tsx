import { Route, Switch } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';

export const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <div className="dark:bg-neutral-950 bg-neutral-100 dark:text-white h-full">
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>
          <Route path="/configure">
            <LoginPage />
          </Route>
        </Switch>
      </div>
    </ThemeProvider>
  );
};
