import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJwtStore } from '@/stores/jwt';
import { Separator } from '@radix-ui/react-separator';
import { useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { Link, Redirect } from 'wouter';
import { AddToStremio } from './components/add-to-stremio';
import { useMe } from '@/hooks/use-me';

const Container = ({ children }: PropsWithChildren) => (
  <div className="container pt-6 pb-24 min-h-full">
    <div className="h-full flex flex-col items-center justify-center space-y-8">{children}</div>
  </div>
);

const ME_QUERY_KEY = 'me';

export const AccountPage = () => {
  const { jwt, logout } = useJwtStore();
  const { data: user, isLoading, isError, error, refetch } = useMe(jwt);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.invalidateQueries({ queryKey: [ME_QUERY_KEY] });
  };

  if (!jwt) {
    return <Redirect to="/configure" />;
  }

  if (isError) {
    return (
      <Container>
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-bold">Error message</p>
            <p>{error.message}</p>
          </CardContent>
          <CardFooter className="flex items-center justify-center gap-x-4 gap-y-2">
            <Button onClick={() => refetch()}>Retry</Button>
            <Button onClick={handleLogout}>Login</Button>
          </CardFooter>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>
            Welcome,{' '}
            {isLoading ? (
              <Skeleton className="w-32 rounded-md h-7 inline-block align-sub" />
            ) : (
              <span>{user?.username}</span>
            )}
          </CardTitle>
        </CardHeader>
        <Separator decorative orientation="horizontal" className="mb-4 border" />

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full">
            <h3 className="text-lg font-bold">Role</h3>
            <p>
              {isLoading ? (
                <Skeleton className="w-32 rounded-md h-4 align-sub" />
              ) : (
                <div className="flex gap-3">
                  <span>{user?.role.toLocaleUpperCase()}</span>
                  <Link
                    className="font-medium underline underline-offset-4 hover:decoration-2"
                    to="/torrents"
                  >
                    See active torrents
                  </Link>
                </div>
              )}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Preferred language</h3>
            <p>
              {isLoading ? (
                <Skeleton className="w-32 rounded-md h-4 align-sub" />
              ) : (
                user?.preferred_lang
              )}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Preferred resolutions</h3>
            <p>
              {isLoading ? (
                <Skeleton className="w-32 rounded-md h-4 align-sub" />
              ) : (
                user?.preferred_resolutions.join(', ')
              )}
            </p>
          </div>
          <div className="col-span-full h-8"></div>
          <div className="col-span-full">
            <AddToStremio jwt={jwt} />
          </div>
        </CardContent>
        <Separator decorative orientation="horizontal" className="mb-4 border" />
        <CardFooter className="flex items-center justify-end">
          <Button onClick={handleLogout} className="min-w-full sm:min-w-0" variant="destructive">
            Logout
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
};
