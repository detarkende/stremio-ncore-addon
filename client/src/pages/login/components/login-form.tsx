import { useForm } from 'react-hook-form';
import { loginSchema, type LoginFormValues, defaultValues } from '../constants';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Redirect } from 'wouter';
import { useMe } from '@/hooks/use-me';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { handleError, HttpError } from '@/lib/errors';
import { QueryKeys } from '@/constants/query-keys';
import { toast } from 'sonner';

export const LoginForm = () => {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const { mutateAsync: login } = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const req = await api.login.$post({ json: credentials });
      if (!req.ok) {
        throw new HttpError(req);
      }
    },
    onError: (e) => handleError(e, 'Failed to login'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ME] });
      toast.success('Logged in successfully');
    },
  });
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'all',
    defaultValues,
  });

  const {
    formState: { isSubmitting, isValid, isValidating },
  } = form;

  const handleSubmit = form.handleSubmit(async (data) => {
    await login(data);
  });

  if (me) {
    return <Redirect to="/account" />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="h-full flex flex-col items-center justify-center space-y-8"
      >
        <Card className="w-full max-w-xl">
          <CardHeader className="flex flex-col items-center text-center">
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-center text-center">
            <Button
              type="submit"
              size="lg"
              disabled={!isValid || isSubmitting || isValidating}
              className="flex items-center justify-center min-w-32 space-x-2"
            >
              {isSubmitting && <LoadingSpinner className="size-3" />}
              <span>Login</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
