import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingSpinner = ({ className = '' }) => (
  <LoaderCircle className={cn('animate-spin', className)} />
);
