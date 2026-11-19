import { Spinner } from '@heroui/react';

export function LoaderScreen() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
