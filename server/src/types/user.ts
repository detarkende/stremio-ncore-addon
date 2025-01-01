import { Language, Resolution, UserRole, usersTable } from '@/db/schema/users';
import {
  createUserSchema,
  editUserSchema,
  updatePasswordSchema,
} from '@/schemas/user.schema';
import { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';

export class User {
  public id: number;
  public username: string;
  public role: UserRole;
  public preferredLanguage: Language;
  public preferredResolutions: Resolution[];

  constructor(dbResult: InferSelectModel<typeof usersTable>) {
    this.id = dbResult.id;
    this.username = dbResult.username;
    this.role = dbResult.role;
    this.preferredLanguage = dbResult.preferred_language;
    this.preferredResolutions = dbResult.preferred_resolutions;
  }
}

export type CreateUserRequest = z.infer<typeof createUserSchema>;

export type EditUserRequest = z.infer<typeof editUserSchema>;

export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
