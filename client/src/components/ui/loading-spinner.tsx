import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';

export const LoadingSpinner = ({ className = '' }) => (
  <LoaderCircle className={cn('animate-spin', className)} />
);
