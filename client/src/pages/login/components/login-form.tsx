import { useForm } from 'react-hook-form';
import { loginSchema, type LoginFormValues } from '../constants';
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

export const LoginForm = () => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleSubmit = form.handleSubmit(async () => null);
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="h-full flex items-center justify-center">
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
            <Button type="submit" size="lg">
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
