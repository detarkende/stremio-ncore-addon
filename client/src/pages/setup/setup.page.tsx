import { useIsConfigured } from '@/hooks/use-is-configured';
import { SetupForm } from './components/setup-form';
import { Redirect } from 'wouter';

export const SetupPage = () => {
  const { isConfigured } = useIsConfigured();

  if (isConfigured === true) {
    return <Redirect to="/" />;
  }
  return (
    <div className="container pt-6 pb-24 min-h-full">
      <SetupForm />
    </div>
  );
};
