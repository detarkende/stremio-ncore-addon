import { LoadingSpinner } from './loading-spinner';

export const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-60 flex items-center justify-center">
      <LoadingSpinner className="size-14 text-white" />
    </div>
  );
};
