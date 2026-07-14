export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Language = {
  EN: 'en',
  HU: 'hu',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export { Resolution } from '@ctrl/video-filename-parser';
