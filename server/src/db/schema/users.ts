import { Resolution } from '@ctrl/video-filename-parser';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
export { Resolution };
export enum Language {
  EN = 'en',
  HU = 'hu',
}

export const userRoleValues = [UserRole.ADMIN, UserRole.USER] as const;
export const resolutionValues: Resolution[] = [
  Resolution.R480P,
  Resolution.R540P,
  Resolution.R576P,
  Resolution.R720P,
  Resolution.R1080P,
  Resolution.R2160P,
] as const;
export const languageValues = [Language.EN, Language.HU] as const;

export const usersTable = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: text({ enum: userRoleValues }).$type<UserRole>().notNull(),
  preferred_resolutions: text({ mode: 'json' }).$type<Resolution[]>().notNull(),
  preferred_language: text({ enum: languageValues }).$type<Language>().notNull(),
});
