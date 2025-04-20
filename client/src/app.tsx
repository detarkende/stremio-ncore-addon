import { lazy, Suspense } from 'react';
import { Redirect, Route, Switch } from 'wouter';
import { useMe } from './hooks/use-me';
import { useIsConfigured } from './hooks/use-is-configured';
import { Toaster } from './components/ui/sonner';

import { ROUTES } from './constants/routes';

import { Layout } from './components/layout';
import { PageLoader } from './components/ui/page-loader';

const SettingsPage = lazy(() => import('@/pages/settings'));
const LoginPage = lazy(() => import('@/pages/login'));
const AccountPage = lazy(() => import('@/pages/account'));
const TorrentsPage = lazy(() => import('@/pages/torrents'));
const SetupPage = lazy(() => import('@/pages/setup'));

export const App = () => {
  const { me } = useMe();

  const { isConfigured } = useIsConfigured();
  return (
    <Layout>
      <Switch>
        <Route path={ROUTES.SETUP}>
          <Suspense fallback={<PageLoader />}>
            <SetupPage />
          </Suspense>
        </Route>
        {isConfigured === false && <Redirect to={ROUTES.SETUP} />}
        <Route path={ROUTES.LOGIN}>
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        </Route>
        {me === null && <Redirect to={ROUTES.LOGIN} />}
        <Route path="/configure">
          <Redirect to={ROUTES.LOGIN} />
        </Route>
        <Route path={ROUTES.ACCOUNT}>
          <Suspense fallback={<PageLoader />}>
            <AccountPage />
          </Suspense>
        </Route>
        <Route path={ROUTES.SETTINGS}>
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        </Route>
        <Route path={ROUTES.TORRENTS}>
          <Suspense fallback={<PageLoader />}>
            <TorrentsPage />
          </Suspense>
        </Route>
        <Route path="*">
          {me ? <Redirect to={ROUTES.ACCOUNT} /> : <Redirect to={ROUTES.LOGIN} />}
        </Route>
      </Switch>
      <Toaster />
    </Layout>
  );
};
