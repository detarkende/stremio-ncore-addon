import { Separator } from '@radix-ui/react-separator';
import { Redirect } from 'wouter';
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
import { useMe } from '@/hooks/use-me';
import { UserActions } from '@/components/user';
import { TorrentSourceIssues } from '@/components/torrent-source-issues';
import { TruncatedText } from '@/components/ui/truncated-text';
import { CopyToClipboardButton } from '@/components/ui/copy-to-clipboard-button';
import { api } from '@/api';
import { useConfig } from '@/hooks/use-config';

export const AccountPage = () => {
  const { me, logout, isLoading, isError, error, refetch } = useMe();
  const { config } = useConfig();

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

  const addonManifestUrl = api.auth[':token']['manifest.json'].$url({
    param: { token: me.token },
  });
  let addonManifestUrlString = addonManifestUrl.toString();
  if (config?.addonUrl) {
    addonManifestUrlString = addonManifestUrlString.replace(
      addonManifestUrl.origin,
      config.addonUrl,
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
            <h3 className="text-lg font-bold">Your addon URL</h3>
            <p className="text-slate-500">
              This addon URL authenticates you with the addon. Do not share it with
              others.
            </p>
            <p className="px-3 bg-gray-200 rounded-sm text-gray-800 flex justify-between items-center gap-x-1 font-mono">
              <TruncatedText className="py-2">{addonManifestUrlString}</TruncatedText>
              <CopyToClipboardButton text={addonManifestUrlString} />
            </p>
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
