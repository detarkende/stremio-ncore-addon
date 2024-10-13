import { DefaultValues } from 'react-hook-form';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string({
      invalid_type_error: 'Username must be a string',
      required_error: 'Username is required',
    })
    .min(1, 'Username is required'),
  password: z
    .string({
      invalid_type_error: 'Password must be a string',
      required_error: 'Password is required',
    })
    .min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const defaultValues: DefaultValues<LoginFormValues> = {
  username: '',
  password: '',
};
