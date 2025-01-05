import { LoadingSpinner } from './loading-spinner';

export const PageLoader = () => {
  return (
    <div className="h-full grid place-items-center">
      <LoadingSpinner className="size-10" />
    </div>
  );
};
