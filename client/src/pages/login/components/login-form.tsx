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
import { Alert } from '@/components/ui/alert';
import { useLogin } from '../hooks/use-login';
import { SuccessMessage } from './success-message';

export const LoginForm = () => {
  const { mutateAsync: login, data, isError, error } = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'all',
    defaultValues,
  });

  const {
    formState: { isSubmitting, isValid, isValidating },
  } = form;

  const handleSubmit = form.handleSubmit(async (data) => await login({ json: data }));

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
        <div className="max-w-xl w-full">
          {isError && <Alert variant="error" title="Error" description={error.message} />}
          {data && !data.success && (
            <Alert variant="error" title="Error" description={data.message} />
          )}
          {data && data.success && <SuccessMessage jwt={data.jwt} />}
        </div>
      </form>
    </Form>
  );
};
