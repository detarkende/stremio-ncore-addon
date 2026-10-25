import { Resolution, UserRole, Language } from './user.types';

export const PASSWORD_SALT_ROUNDS = 10;

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
