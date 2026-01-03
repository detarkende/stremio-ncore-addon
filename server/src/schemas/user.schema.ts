import { z } from 'zod';
import { Language, Resolution } from 'src/db/schema/users';

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  preferredLanguage: z.enum(Language, {
    error: 'Preferred language is required',
  }),
  preferredResolutions: z
    .array(z.nativeEnum(Resolution))
    .min(1, 'At least one resolution is required'),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.omit({
  password: true,
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export const updatePasswordSchema = createUserSchema.pick({
  password: true,
});

export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
