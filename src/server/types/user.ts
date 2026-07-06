import type { Language, Resolution, UserRole, usersTable } from '@server/db/schema/users';
import type { InferSelectModel } from 'drizzle-orm';

export class User {
  public id: number;
  public username: string;
  public role: UserRole;
  public preferredLanguage: Language;
  public preferredResolutions: Resolution[];
  public token: string;

  constructor(dbResult: InferSelectModel<typeof usersTable>) {
    this.id = dbResult.id;
    this.username = dbResult.username;
    this.role = dbResult.role;
    this.preferredLanguage = dbResult.preferred_language;
    this.preferredResolutions = dbResult.preferred_resolutions;
    this.token = dbResult.token;
  }
}
