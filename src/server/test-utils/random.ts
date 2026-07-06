import crypto from 'node:crypto';

export function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getRandomInt(
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomBoolean(): boolean {
  return Math.random() < 0.5;
}

export function getRandomUuid(): string {
  return crypto.randomUUID();
}
