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
import { Separator } from '@radix-ui/react-separator';
import { Redirect } from 'wouter';
import { useMe } from '@/hooks/use-me';
import { DeviceTokenList } from './components/device-token-list';
import { UserActions } from '@/components/user';
import { TorrentSourceIssues } from '@/components/torrent-source-issues';

export const AccountPage = () => {
  const { me, logout, isLoading, isError, error, refetch } = useMe();

  const handleLogout = async () => {
    await logout();
  };

  if (!me) {
    return <Redirect to="/configure" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <TorrentSourceIssues />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              Welcome,{' '}
              {isLoading ? (
                <Skeleton className="w-32 rounded-md h-7 inline-block align-sub" />
              ) : (
                <span>{me?.username}</span>
              )}
            </CardTitle>
            <UserActions user={me} isDeleteEnabled={false} />
          </div>
        </CardHeader>
        <Separator decorative orientation="horizontal" className="mb-4 border" />

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full">
            <h3 className="text-lg font-bold">Your devices</h3>
            <p className="text-slate-500">Select or create a device to add to Stremio</p>
            <DeviceTokenList />
          </div>
        </CardContent>
        <Separator decorative orientation="horizontal" className="mb-4 border" />
        <CardFooter className="flex items-center justify-end">
          <Button
            onClick={handleLogout}
            className="min-w-full sm:min-w-0"
            variant="destructive"
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
