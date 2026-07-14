import { Resolution } from '@ctrl/video-filename-parser';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export { Resolution };
export const Language = {
  EN: 'en',
  HU: 'hu',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

const userRoleValues = [UserRole.ADMIN, UserRole.USER] as const;
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
  token: text().notNull().unique(),
  token_rotated_at: integer({ mode: 'timestamp' }).notNull(),
});
