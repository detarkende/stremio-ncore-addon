import { api } from '@/api';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import type { InferRequestType, InferResponseType } from 'hono/client';

type MutateProps = InferRequestType<typeof api.api.login.$post>;
type MutateResponse = InferResponseType<typeof api.api.login.$post>;

export const useLogin = (
  options?: Omit<UseMutationOptions<MutateResponse, Error, MutateProps>, 'mutationFn'>,
) => {
  return useMutation({
    ...options,
    mutationFn: async (input: MutateProps) => {
      const response = await api.api.login.$post(input);
      return response.json();
    },
  });
};
